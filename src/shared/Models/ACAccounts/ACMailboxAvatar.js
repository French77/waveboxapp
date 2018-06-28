import Model from '../Model'
class ACMailboxCircle extends Model {
  /* **************************************************************************/
  // Class
  /* **************************************************************************/

  /**
  * Populates a version from a mailbox and list of services
  * @param mailbox: the mailbox to use
  * @param serviceMap: the full map of services that can be used
  * @param avatarMap: the full map of avatars that can be used
  */
  static autocreate (mailbox, serviceMap, avatarMap) {
    const services = mailbox
      .allServices
      .map((id) => serviceMap.get(id))
      .filter((s) => !!s)

    const memberHashes = new Set([mailbox.versionedId])

    const data = {
      displayName: this._getDisplayName(memberHashes, mailbox, services),
      color: mailbox.color,
      showAvatarColorRing: mailbox.showAvatarColorRing,
      avatarCharacterDisplay: this._getAvatarCharacterDisplay(memberHashes, services),
      rawAvatar: this._getRawAvatar(memberHashes, mailbox, services, avatarMap)
    }

    data.memberHashes = Array.from(memberHashes)
    return data
  }

  /**
  * Gets the display name
  * @param memberHashes: the member hashes to add to
  * @param mailbox: the root mailbox
  * @param services: the ordered services list
  * @return the display name
  */
  static _getDisplayName (memberHashes, mailbox, services) {
    if (mailbox.displayName !== undefined) {
      memberHashes.add(mailbox.versionedId)
      return mailbox.displayName
    } else {
      return (services.find((service) => {
        if (service.displayName !== undefined) {
          memberHashes.add(service.versionedId)
          return true
        }
        return false
      }) || {}).displayName || 'Untitled'
    }
  }

  /**
  * Gets the avatar character display
  * @param memberHashes: the member hashes to add in
  * @param services: the list of serviced ordered
  * @return the character display or undefined
  */
  static _getAvatarCharacterDisplay (memberHashes, services) {
    return (services.find((service) => {
      if (service.serviceAvatarCharacterDisplay !== undefined) {
        memberHashes.add(service.versionedId)
        return true
      }
    }) || {}).serviceAvatarCharacterDisplay
  }

  /**
  * Gets the raw avatar
  * @param memberHashes: the member hashes to add to
  * @param mailbox: the root mailbox
  * @param services: the ordered services list
  * @param avatarMap: the avatar map
  * @return the avatar in the format { uri: '' }, { id: '' }, or undefined
  */
  static _getRawAvatar (memberHashes, mailbox, services, avatarMap) {
    if (mailbox.hasAvatarId) {
      memberHashes.add(mailbox.versionedId)
      return { id: avatarMap.get(mailbox.avatarId) }
    } else {
      // First get a service with a custom avatar
      const serviceWithCustom = services.find((service) => {
        return service.hasAvatarId || service.hasServiceAvatarURL || service.hasServiceLocalAvatarId
      })
      if (serviceWithCustom) {
        if (serviceWithCustom.hasAvatarId) {
          return { id: avatarMap.get(serviceWithCustom.avatarId) }
        } else if (serviceWithCustom.hasServiceLocalAvatarId) {
          return { id: avatarMap.get(serviceWithCustom.serviceLocalAvatarId) }
        } else {
          return { uri: serviceWithCustom.serviceAvatarURL }
        }
      }

      // Then get a service with the standard icon
      const serviceWithStandard = services.find((service) => {
        return !!service.humanizedLogo
      })
      if (serviceWithStandard) {
        return { uri: serviceWithStandard.humanizedLogo }
      }

      // Finally just fail
      return undefined
    }
  }

  /* **************************************************************************/
  // Properties
  /* **************************************************************************/

  get hashId () { return this._value_('memberHashes', []).join(':') }

  /* **************************************************************************/
  // Properties: Display
  /* **************************************************************************/

  get displayName () { return this._value_('displayName', 'Untitled') }
  get color () { return this._value_('color', '#FFFFFF') }
  get showAvatarColorRing () { return this._value_('showAvatarColorRing', true) }
  get avatarCharacterDisplay () { return this._value_('avatarCharacterDisplay', undefined) }
  get rawAvatar () { return this._value_('rawAvatar', undefined) }
  get hasAvatar () { return this.rawAvatar && (this.rawAvatar.uri || this.rawAvatar.id) }

  /**
  * Resolves a raw avatar
  * @param resolver that can be used to resolve local paths
  * @return a resolved avatar
  */
  resolveAvatar (resolver) {
    if (!this.hasAvatar) { return undefined }
    const raw = this.rawAvatar
    if (raw.uri) {
      if (raw.uri.startsWith('http://') || raw.uri.startsWith('https://')) {
        return raw.uri
      } else {
        return resolver ? resolver(raw.uri) : raw.uri
      }
    } else if (raw.id) {
      return raw.id
    } else {
      return raw
    }
  }
}

export default ACMailboxCircle
