const {promisify} = require('util')
const exec = promisify(require('child_process').exec)
const fs = require('fs')

/**
 * PiVPNJs.
 * @class PiVPNJs - a pivpn javascript wrapper
 */
module.exports = class PiVPNJs {
    #confPath;
    #isConfPathSet;

    /**
     * Creates a PiVPNJs wrapper
     * @constructor
     * @param {path} confPath - Full path to conf files dir
     */
    constructor(confPath){        
        if(confPath?.length > 1)
            this.setConfPath(confPath)
    }

    /**
     * Get path to conf files
     * @return {path} Returns confPath
     */
    getConfPath = () => this.#confPath

    /**
     * Set path to conf files
     * @param {path} confPath - Set path to conf files dir
     * @return {boolean} Returns true if conf path set
     */
    setConfPath = confPath => {
        if(fs.existsSync(confPath)){
            this.#confPath = confPath
            this.#isConfPathSet = true            
        }
        return this.#isConfPathSet            
    }
    
    /**
     * Creates a client conf profile
     * @async
     * @param {string} userName - A uniqui user name
     * @return {boolean} True for added
     */
    addUser = async (userName) => {

        const {stdout} = await exec(`pivpn -a -n ${userName}`)

        return stdout.includes("Client Keys generated")
    }

    /**
     * ConnectionDetails Object
     * @typedef {Object} ConnectionDetails
     * @property {string} userName - The user name
     * @property {string} remoteIP - User remote IP
     * @property {string} virtualIP - User virtual IP
     * @property {number} bytesReceived - User total bytes reveived
     * @property {number} bytesSent - User total bytes sent
     * @property {Date} lastSeen - User total bytes reveived
     */
    
    /**
     * Returns an array of ConnectionDetails for all users
     * @async
     * @return {ConnectionDetails[]} Returns an array of connections details
     */
    getConnectionDetailsForAllUsers = async () => {
        let {stdout} = await exec(`pivpn -c`)
        stdout = stdout.split("\n")
        return stdout.slice(2,stdout.length -1 )
                .map(line => {
                    line = line.split(/   */)
                    return {
                        userName: line[0],
                        remoteIP: line[1],
                        virtualIP: line[2],
                        bytesReceived: line[3],
                        bytesSent: line[4],
                        lastSeen: line[5]
                    }
                })
    }

    /**
     * Returns ConnectionDetails for a users
     * @async
     * @param {string} userName - A user name
     * @return {ConnectionDetails} Returns ConnectionDetails for a users or undefined
     */
     getConnectionDetailsForUser = async (userName) => {
         return (await this.getConnectionDetailsForAllUsers()).filter( user => user.userName === userName)[0]
     }

    /**
     * UserInfo Object
     * @typedef {Object} UserInfo
     * @property {string} userName - The user name
     * @property {string} pubKey - User public key
     * @property {Date} creationDate - User creation date
     */ 

    /**
     * Returns an array of UserInfo for all users
     * @async
     * @return {UserInfo[]} Returns an array of UserInfo
     */
    getAllUsersInfo = async () => {
        const {stdout, stderr} = await exec(`pivpn -l`)

        if(stderr.length > 0)
            return []

        let lines = stdout.split("\n")
        lines = lines.slice(2, lines.length -1)

        if(lines.length < 1)
            return []

        return lines.map( line => {
            line = line.split(/   */)
            return {userName: line[0], pubKey: line[1], creationDate: line[2] }
        })
    }

    /**
     * Returns UserInfo for a users
     * @async
     * @param {string} userName - A user name
     * @return {UserInfo} Returns UserInfo for a users or undefined
     */
     getUserInfo = async (userName) => {
        return (await this.getAllUsersInfo()).filter( user => user.userName === userName)[0]
     }

    /**
     * Returns the conf path of a client
     * @param {string} userName - A user name
     * @returns {path} Return a user conf path or null
     */
    getUserFileLocation = async (userName) => {
        if(!this.#isConfPathSet)
            throw "ConfPathSet not set"

        if (fs.existsSync(`${this.#confPath}/${userName}.conf`)) {
            return `${this.#confPath}/${userName}.conf`
        }

       return null
    }

    /**
     * Creates qrcode for a client. Return qrcode path
     * @async
     * @param {string} userName - A user name
     * @returns {path} Returns the qrcode of a client or null if client not found
     */
    generateUserQrCode = async (userName) => {
        if(!this.#isConfPathSet)
            throw "ConfPathSet not set"

        const userFileLocation = await this.getUserFileLocation(userName)

        if(userFileLocation === null)
            return null

        const pngLocation = `${this.getConfPath()}/${userName}.png`

        await exec(`cat ${userFileLocation} | qrencode -o ${pngLocation}`)

        return pngLocation
    }

    /**
     * Returns the qrcode of a client (creates on if doesn't exists)
     * @param {string} userName - A user name
     * @returns {path} Returns the qrcode of a client or null
     */
    getUserQrCodePath = async (userName) => {
      
        const pngLocation = `${this.getConfPath()}/${userName}.png`

        if (fs.existsSync(pngLocation)) {
            return pngLocation
        }

        return await this.generateUserQrCode(userName)
    }

    /**
     * Returns a stream qrcode of a client 
     * @async
     * @param {string} userName - A user name
     * @returns {ReadStream} ReadStream of qr code png or null
     */
     getUserQrCodeStream = async (userName) => {
        if(!this.#isConfPathSet)
            throw "ConfPathSet not set"

        const qrPath = await this.getUserQrCodePath(userName)

        if(qrPath === null)
            return null

        return fs.ReadStream(qrPath)
    }

    /**
     * Remove a client
     * @async
     * @param {string} userName - A user name
     * @returns {boolean} Return true for removed
     */
    removeUser = async (userName) => {
        const {stdout} = await exec(`pivpn -r -y ${userName}`)
        return stdout.includes("does not exist")
                ? false
                : true
    }

    /**
     * Updates PiVPN Scripts
     * @async
     * @returns {boolean} Returns true for updated
     */
     updatePiVPN = async () => {
        const {stdout} = await exec(`pivpn -up`)
        return stdout.includes("PiVPN scripts is temporarily disabled")
                ? false
                : true
    }

    /**
     * BackupInfo Object
     * @typedef {Object} BackupInfo
     * @property {path} backupPath - Backup file path
     * @property {url} instructionsURL - Restore backup instructions URL
     */

    /**
     * Backup VPN confs and user profiles
     * @async
     * @returns {BackupInfo} Backup information
     */
     backup = async () => {
        let {stdout} = await exec(`pivpn -bk`)
        stdout = stdout.split("\n")
        return {
            backupPath: stdout[0],
            instructionsURL: stdout[2]
        }
    }
}
