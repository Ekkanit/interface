import { useEffect, useRef } from 'react'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { UniverseChainId } from 'uniswap/src/types/chains'

interface SwapChains {
  inputChainId?: UniverseChainId
  outputChainId?: UniverseChainId
}

export function useSwapNetworkNotification({
  inputChainId,
  outputChainId,
}: {
  inputChainId?: UniverseChainId
  outputChainId?: UniverseChainId
}): void {
  const { onSwapChainsChanged } = useUniswapContext()
  const lastNetworkNotification = useRef<SwapChains>({
    inputChainId: undefined,
    outputChainId: undefined,
  })

  useEffect(() => {
    const { inputChainId: lastInputChainId, outputChainId: lastOutputChainId } = lastNetworkNotification.current

    // Set initial values but don't fire notification for first network selection
    if (!lastInputChainId && !lastOutputChainId) {
      lastNetworkNotification.current = { inputChainId, outputChainId }
      return
    }

    // Check if either chain has changed
    const hasInputChanged = inputChainId !== lastInputChainId
    const hasOutputChanged = outputChainId !== lastOutputChainId

    // Skip if no changes
    if (!hasInputChanged && !hasOutputChanged) {
      return
    }

    // Determine notification type and trigger
    if (inputChainId && outputChainId && inputChainId !== outputChainId) {
      onSwapChainsChanged(inputChainId, outputChainId) // Bridging notification
    } else if (inputChainId && (hasInputChanged || (hasOutputChanged && inputChainId === outputChainId))) {
      onSwapChainsChanged(inputChainId) // Non-bridging notification
    }

    // Update last notification state
    lastNetworkNotification.current = { inputChainId, outputChainId }
  }, [inputChainId, outputChainId, onSwapChainsChanged])
}