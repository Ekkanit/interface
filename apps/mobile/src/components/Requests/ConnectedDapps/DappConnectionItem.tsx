import { getSdkError } from '@walletconnect/utils'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent, StyleSheet } from 'react-native'
import ContextMenu, { ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import 'react-native-reanimated'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useDispatch } from 'react-redux'
import { DappHeaderIcon } from 'src/components/Requests/DappHeaderIcon'
import { wcWeb3Wallet } from 'src/features/walletConnect/saga'
import { WalletConnectSession, removeSession } from 'src/features/walletConnect/walletConnectSlice'
import { disableOnPress } from 'src/utils/disableOnPress'
import { AnimatedTouchableArea, Flex, ImpactFeedbackStyle, Text, TouchableArea } from 'ui/src'
import { iconSizes, spacing } from 'ui/src/theme'
import { NetworkLogos } from 'uniswap/src/components/network/NetworkLogos'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { WalletConnectEvent } from 'uniswap/src/types/walletConnect'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

export function DappConnectionItem({
  session,
  isEditing,
  onPressChangeNetwork,
}: {
  session: WalletConnectSession
  isEditing: boolean
  onPressChangeNetwork: (session: WalletConnectSession) => void
}): JSX.Element {
  const { t } = useTranslation()
  const { dapp } = session
  const dispatch = useDispatch()
  const address = useActiveAccountAddressWithThrow()

  const onDisconnect = async (): Promise<void> => {
    try {
      dispatch(removeSession({ account: address, sessionId: session.id }))
      // Explicitly verify that WalletConnect has this session id as an active session
      // It's possible that the session was already disconnected on WC but wasn't updated locally in redux
      const sessions = wcWeb3Wallet.getActiveSessions()
      if (sessions[session.id]) {
        await wcWeb3Wallet.disconnectSession({
          topic: session.id,
          reason: getSdkError('USER_DISCONNECTED'),
        })
      }
      dispatch(
        pushNotification({
          type: AppNotificationType.WalletConnect,
          address,
          dappName: dapp.name,
          event: WalletConnectEvent.Disconnected,
          imageUrl: dapp.icon,
          hideDelay: 3 * ONE_SECOND_MS,
        }),
      )
    } catch (error) {
      logger.error(error, { tags: { file: 'DappConnectionItem', function: 'onDisconnect' } })
    }
  }

  const menuActions = [{ title: t('common.button.disconnect'), systemIcon: 'trash', destructive: true }]

  const onPress = async (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>): Promise<void> => {
    if (e.nativeEvent.index === 0) {
      await onDisconnect()
    }
  }

  return (
    <ContextMenu actions={menuActions} style={styles.container} onPress={onPress}>
      <Flex
        grow
        backgroundColor="$surface2"
        borderRadius="$rounded16"
        gap="$spacing12"
        justifyContent="space-between"
        mb="$spacing12"
        pb="$spacing12"
        pt="$spacing24"
        px="$spacing12"
      >
        <Flex
          alignSelf="flex-end"
          position="absolute"
          right={spacing.spacing12}
          top={spacing.spacing12}
          zIndex="$tooltip"
        >
          {isEditing ? (
            <AnimatedTouchableArea
              hapticFeedback
              alignItems="center"
              backgroundColor="$neutral3"
              borderRadius="$roundedFull"
              entering={FadeIn}
              exiting={FadeOut}
              height={iconSizes.icon28}
              justifyContent="center"
              width={iconSizes.icon28}
              zIndex="$tooltip"
              onLongPress={disableOnPress}
              onPress={onDisconnect}
            >
              <Flex backgroundColor="$surface1" borderRadius="$rounded12" height={2} width={14} />
            </AnimatedTouchableArea>
          ) : (
            <Flex height={iconSizes.icon28} width={iconSizes.icon28} />
          )}
        </Flex>
        <Flex grow alignItems="center" gap="$spacing8">
          <DappHeaderIcon dapp={dapp} />
          <Text numberOfLines={2} textAlign="center" variant="buttonLabel2">
            {dapp.name || dapp.url}
          </Text>
          <Text color="$accent1" numberOfLines={1} textAlign="center" variant="buttonLabel2">
            {dapp.url}
          </Text>
        </Flex>

        <TouchableArea
          hapticFeedback
          hapticStyle={ImpactFeedbackStyle.Medium}
          testID={TestID.WCDappNetworks}
          onLongPress={disableOnPress}
          onPress={(): void => onPressChangeNetwork(session)}
        >
          <NetworkLogos chains={session.chains} />
        </TouchableArea>
      </Flex>
    </ContextMenu>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '48%',
  },
})
