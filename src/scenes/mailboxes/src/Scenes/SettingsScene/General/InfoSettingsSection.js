const React = require('react')
const {Paper} = require('material-ui')
const styles = require('../SettingStyles')
const shallowCompare = require('react-addons-shallow-compare')
const Colors = require('material-ui/styles/colors')
const { remote } = window.nativeRequire('electron')
const { mailboxStore, mailboxDispatch } = require('stores/mailbox')
const pkg = window.appPackage()

module.exports = React.createClass({
  /* **************************************************************************/
  // Class
  /* **************************************************************************/

  displayName: 'InfoSettingsSection',

  /* **************************************************************************/
  // UI Event
  /* **************************************************************************/

  /**
  * Shows a snapshot of the current memory consumed
  */
  handleShowMemoryInfo (evt) {
    evt.preventDefault()

    const sizeToMb = (size) => { return Math.round(size / 1024) }

    mailboxDispatch.fetchProcessMemoryInfo().then((mailboxesProc) => {
      const mailboxProcIndex = mailboxesProc.reduce((acc, info) => {
        acc[`${info.mailboxId}:${info.serviceType}`] = info.memoryInfo
        return acc
      }, {})
      const mailboxes = mailboxStore.getState().allMailboxes()
      const memoryInfo = mailboxes.reduce((acc, mailbox, index) => {
        mailbox.enabledServices.map((service) => {
          const procInfo = mailboxProcIndex[`${mailbox.id}:${service.type}`] || {}
          const size = sizeToMb(procInfo.workingSetSize || 0)
          acc.push(`Mailbox ${index + 1} ${service.humanizedType}: ${size}mb`)
        })
        acc.push('')
        return acc
      }, [])

      window.alert([
        `Main Process ${sizeToMb(remote.process.getProcessMemoryInfo().workingSetSize)}mb`,
        `Mailboxes Window ${sizeToMb(process.getProcessMemoryInfo().workingSetSize)}mb`,
        ''
      ].concat(memoryInfo).join('\n'))
    })
  },

  /* **************************************************************************/
  // Rendering
  /* **************************************************************************/

  shouldComponentUpdate (nextProps, nextState) {
    return shallowCompare(this, nextProps, nextState)
  },

  render () {
    return (
      <Paper zDepth={1} style={styles.paper} {...this.props}>
        <a
          style={{color: Colors.blue700, fontSize: '85%', marginBottom: 10, display: 'block'}}
          onClick={this.handleShowMemoryInfo}
          href='#'>Memory Info</a>
        <div style={{ fontSize: '85%' }}>
          <p>
            {`Wavebox ${pkg.version}`}
          </p>
          <p style={{color: Colors.grey400}}>
            {`Electron/${process.versions.electron} Chromium/${process.versions.chrome}`}
          </p>
        </div>
      </Paper>
    )
  }
})
