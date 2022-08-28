import { Button, HStack, IconButton, Text, VStack, Hide, Show } from '@chakra-ui/react';
import AssetInput from 'components/AssetInput';
import DoubleArrowsIcon from "components/icons/DoubleArrowsIcon";
import { useEffect, FC, useMemo, Fragment } from 'react';
import { Controller, useForm } from "react-hook-form";
import { useMultipleTokenBalance } from 'hooks/useTokenBalance';
import { TxStep } from 'hooks/useTransaction';
import { fromChainAmount } from "libs/num";
import { TokenItemState } from './swapAtoms';
import { Simulated } from './hooks/useSimulate'
import { num } from 'libs/num'


type Props = {
    connected: boolean;
    tokenA: TokenItemState;
    tokenB: TokenItemState;
    onInputChange: (asset: TokenItemState, index: number) => void;
    simulated: Simulated;
    isReverse: boolean;
    tx: any;
    state: any;
    minReceive: string
    onReverseDirection: () => void
    setReverse: (valuse: boolean) => void
    resetForm: boolean
    setResetForm: (value: boolean) => void
    path: string[]
}

const SwapForm: FC<Props> = ({
    connected,
    tokenA,
    tokenB,
    onInputChange,
    onReverseDirection,
    simulated,
    tx,
    state,
    minReceive,
    isReverse,
    setReverse,
    resetForm,
    setResetForm,
    path
}) => {

    const { control, handleSubmit, setValue, getValues } = useForm({
        mode: "onChange",
        defaultValues: {
            tokenA,
            tokenB
        },
    });

    useEffect(() => {
        if (resetForm || tx?.txStep === TxStep.Success) {
            setValue('tokenA', { ...tokenA, amount: 0 })
            setValue('tokenB', { ...tokenB, amount: 0 })
            setResetForm(false)
        }

    }, [resetForm, tx?.txStep])

    const [[tokenABalance, tokenBBalance] = []] = useMultipleTokenBalance([tokenA?.tokenSymbol, tokenB?.tokenSymbol])

    const amountA = getValues('tokenA')
    const amountB = getValues('tokenB')

    const buttonLabel = useMemo(() => {

        if (!connected)
            return 'Connect Wallet'
        else if (!tokenA?.tokenSymbol || !tokenB?.tokenSymbol)
            return 'Select Token'
        else if (state?.error)
            return state?.error
        else if (!!!amountA?.amount)
            return 'Enter Amount'
        else if (tx?.buttonLabel)
            return tx?.buttonLabel
        else
            return 'Swap'

    }, [tx?.buttonLabel, tokenB.tokenSymbol, connected, amountA, state?.error])

    const onReverse = () => {
        // setValue("tokenA", tokenB?.amount === 0 ? {...tokenB, amount : parseFloat(fromChainAmount(simulated?.amount))} : tokenB, { shouldValidate: true })
        // setValue("tokenB", tokenA, { shouldValidate: true })

        const A = { ...tokenB, amount: tokenA.amount || parseFloat(fromChainAmount(simulated?.amount)) }
        const B = { ...tokenA, amount: tokenB.amount || parseFloat(fromChainAmount(simulated?.amount)) }
        setValue("tokenA", A, { shouldValidate: true })
        setValue("tokenB", B, { shouldValidate: true })

        onReverseDirection()
    }

    useEffect(() => {

        if (simulated) {
            if (isReverse) {
                const asset = { ...tokenA }
                asset.amount = parseFloat(fromChainAmount(simulated?.amount))
                setValue("tokenA", asset)
                onInputChange({ ...tokenA, amount: parseFloat(fromChainAmount(simulated?.amount)) }, 0);
            } else {
                const asset = { ...tokenB }
                asset.amount = parseFloat(fromChainAmount(simulated?.amount))
                setValue("tokenB", asset)
                onInputChange({ ...tokenB, amount: parseFloat(fromChainAmount(simulated?.amount)) }, 1);
            }
        }
        else {
            if (isReverse) {
                const asset = { ...tokenB }
                if (!!!asset?.amount) {
                    asset.amount = 0
                    setValue("tokenA", asset, { shouldValidate: true })
                }
            }
            else {
                const asset = { ...tokenA }
                if (!!!asset?.amount || state?.error) {
                    asset.amount = 0
                    setValue("tokenB", asset, { shouldValidate: true })
                }
            }
        }

    }, [simulated])

    const isInputDisabled = tx?.txStep == TxStep.Posting

    return (
        <VStack
            paddingX={{ base: 6, md: 10 }}
            paddingY={{ base: 14, md: 10 }}
            width="full"
            background="#1C1C1C"
            boxShadow="0px 0px 50px rgba(0, 0, 0, 0.25)"
            borderRadius="30px"
            alignItems="flex-start"
            minH={400}
            maxWidth={{ base: 'full', md: 650 }}
            gap={4}
            as="form"
            onSubmit={handleSubmit(tx?.submit)}
            overflow="hidden"
            position="relative"

        >


            <VStack width="full" alignItems="flex-start" paddingBottom={2}>
                <HStack justifyContent="space-between" width="full" >

                    <HStack>
                        <Text marginLeft={4} color="brand.200" fontSize="14" fontWeight="500">Balance: </Text>
                        <Text fontSize="14" fontWeight="700">{tokenABalance?.toFixed(2)}</Text>
                    </HStack>

                    <HStack visibility={{ base: 'visible', md: 'hidden' }}>
                        <Button variant="outline" size="xs" maxW="fit-content" onClick={() => {
                            setReverse(false);
                            onInputChange({ ...tokenA, amount: tokenABalance / 2 }, 0);
                            setValue("tokenA", { ...tokenA, amount: tokenABalance / 2 }, { shouldValidate: true })
                        }}>half</Button>
                        <Button variant="outline" size="xs" onClick={() => {
                            setReverse(false);
                            onInputChange({ ...tokenA, amount: tokenABalance }, 0);
                            setValue("tokenA", { ...tokenA, amount: tokenABalance }, { shouldValidate: true })
                        }}>max</Button>
                    </HStack>
                </HStack>
                <Controller
                    name="tokenA"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                        <AssetInput
                            hideToken={tokenA?.tokenSymbol}
                            {...field}
                            token={tokenA}
                            balance={tokenABalance}
                            // onInputFocus={() => setIsReverse(true)}
                            disabled={isInputDisabled}
                            onChange={(value, isTokenChange) => {
                                setReverse(false);
                                onInputChange(value, 0);
                                field.onChange(value);
                            }}

                        />
                    )}
                />
            </VStack>

            <HStack width="full" justifyContent="center">
                <IconButton
                    aria-label="Reverse"
                    variant="ghost"
                    color="brand.500"
                    _focus={{ boxShadow: "none" }}
                    _active={{ background: "transparent" }}
                    _hover={{ background: "transparent", color: "white" }}
                    icon={<DoubleArrowsIcon width="2rem" height="2rem" />}
                    disabled={isInputDisabled}
                    onClick={onReverse}
                />
            </HStack>


            <VStack width="full" alignItems="flex-start" paddingBottom={8} style={{ margin: 'unset' }}>
                <HStack justifyContent="space-between" width="full" >
                    <HStack>
                        <Text marginLeft={4} color="brand.200" fontSize="14" fontWeight="500">Balance: </Text>
                        <Text fontSize="14" fontWeight="700">{tokenBBalance?.toFixed(2)}</Text>
                    </HStack>
                    <HStack>
                        <Hide above='md'>
                            <Button variant="outline" size="xs" onClick={() => {
                                setReverse(true);
                                onInputChange({ ...tokenB, amount: tokenBBalance / 2 }, 1);
                                setValue("tokenB", { ...tokenB, amount: tokenBBalance / 2 }, { shouldValidate: true })
                            }}>half</Button>
                            <Button variant="outline" size="xs" onClick={() => {
                                setReverse(true);
                                onInputChange({ ...tokenB, amount: tokenBBalance / 2 }, 1);
                                setValue("tokenB", { ...tokenB, amount: tokenBBalance }, { shouldValidate: true })
                            }}>max</Button>
                        </Hide>
                    </HStack>
                </HStack>
                <Controller
                    name="tokenB"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                        <AssetInput
                            hideToken={tokenA?.tokenSymbol}
                            {...field}
                            token={tokenB}
                            balance={tokenBBalance}
                            disabled={isInputDisabled}
                            // onInputFocus={() => setIsReverse(true)}
                            onChange={(value, isTokenChange) => {
                                if (tokenB?.tokenSymbol && !isTokenChange) setReverse(true);
                                if (isTokenChange && isReverse) setReverse(false)
                                onInputChange(value, 1);
                                field.onChange(value);
                            }}
                        />
                    )}
                />
            </VStack>

            <Button
                type='submit'
                width="full"
                variant="primary"
                isLoading={tx?.txStep == TxStep.Estimating || tx?.txStep == TxStep.Posting || state?.isLoading}
                disabled={tx?.txStep != TxStep.Ready || simulated == null}
            >
                {buttonLabel}
            </Button>





            <VStack alignItems="flex-start" width="full" px={3}>
                {(amountB.amount) && (<>
                    <HStack justifyContent="space-between" width="full">
                        <Text color="brand.500" fontSize={12}> Price</Text>
                        <Text
                            color="brand.500"
                            fontSize={12}>
                            1 {tokenA.tokenSymbol} = {num(amountB.amount).div(amountA.amount).toFixed(6)} {tokenB.tokenSymbol}
                        </Text>
                    </HStack>


                    <HStack justifyContent="space-between" width="full">
                        <Text color="brand.500" fontSize={12}> Fees </Text>
                        <Text color="brand.500" fontSize={12}> {fromChainAmount(tx?.fee)} </Text>
                    </HStack>

                    {minReceive && (
                        <HStack>
                            <Text color="brand.500" fontSize={12}> Min Receive </Text>
                            <Text color="brand.500" fontSize={12}> {minReceive} </Text>
                        </HStack>
                    )}

                </>
                )}

                <HStack justifyContent="space-between" width="full">
                    <Text color="brand.500" fontSize={12}> Route </Text>
                    <HStack>
                        {path?.map((item, index) => (
                            <Fragment key={item} >
                                <Text color="brand.500" fontSize={12}>  {item}</Text>
                                {index < (path.length - 1) && <Text fontSize={12} >  → </Text>}
                            </Fragment>
                        ))}
                    </HStack>
                </HStack>

            </VStack>




            {/* {
                (tx?.error && !!!tx.buttonLabel) && (<Text color="red" fontSize={12}> {tx?.error} </Text>)
            } */}



        </VStack>
    )
}

export default SwapForm