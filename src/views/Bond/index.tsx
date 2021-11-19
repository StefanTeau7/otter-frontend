import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { trim } from '../../helpers';
import { Grid, Backdrop, Paper, Box, Tab, Tabs, Fade } from '@material-ui/core';
import TabPanel from '../../components/TabPanel';
import BondHeader from './BondHeader';
import BondRedeem from './BondRedeem';
import BondPurchase from './BondPurchase';
import './bond.scss';
import { useWeb3Context } from '../../hooks';
import { Skeleton } from '@material-ui/lab';
import { IReduxState } from '../../store/slices/state.interface';
import { BONDS } from 'src/constants';

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

interface IBondProps {
  bond: string;
}

function Bond({ bond }: IBondProps) {
  const { provider, address } = useWeb3Context();

  const [slippage, setSlippage] = useState(0.5);
  const [recipientAddress, setRecipientAddress] = useState(address);

  const [view, setView] = useState(0);
  const [quantity, setQuantity] = useState();

  const isBondLoading = useSelector<IReduxState, boolean>(state => state.bonding.loading ?? true);
  const marketPrice = useSelector<IReduxState, number>(state => {
    return state.bonding[bond] && state.bonding[bond].marketPrice;
  });
  const bondPrice = useSelector<IReduxState, number>(state => {
    return state.bonding[bond] && state.bonding[bond].bondPrice;
  });

  const onRecipientAddressChange = (e: any) => {
    return setRecipientAddress(e.target.value);
  };

  const onSlippageChange = (e: any) => {
    return setSlippage(e.target.value);
  };

  useEffect(() => {
    if (address) setRecipientAddress(address);
  }, [provider, quantity, address]);

  const changeView = (event: any, newView: number) => {
    setView(newView);
  };

  let bondToken = 'MAI';

  return (
    <Fade in={true} mountOnEnter unmountOnExit>
      <Grid container id="bond-view">
        <Backdrop open={true}>
          <Fade in={true}>
            <Paper className="ohm-card ohm-modal bond-modal">
              <BondHeader
                bond={bond}
                slippage={slippage}
                recipientAddress={recipientAddress}
                onSlippageChange={onSlippageChange}
                onRecipientAddressChange={onRecipientAddressChange}
              />
              {/* @ts-ignore */}
              <Box direction="row" className="bond-price-data-row">
                <div className="bond-price-data">
                  <p className="bond-price-data-title">Bond Price</p>
                  <Box component="p" color="text.secondary" className="bond-price-data-value">
                    {isBondLoading ? <Skeleton /> : '-'}
                  </Box>
                </div>
                <div className="bond-price-data">
                  <p className="bond-price-data-title">CLAM Price</p>
                  <Box component="p" color="text.secondary" className="bond-price-data-value">
                    {isBondLoading ? <Skeleton /> : `$${trim(marketPrice, 2)}`}
                  </Box>
                </div>
              </Box>

              <Tabs
                centered
                value={view}
                indicatorColor="primary"
                onChange={changeView}
                aria-label="bond tabs"
                className="bond-one-table"
              >
                <Tab label="Redeem" {...a11yProps(1)} />
              </Tabs>

              <TabPanel value={view} index={0}>
                <BondRedeem bond={bond} />
              </TabPanel>
            </Paper>
          </Fade>
        </Backdrop>
      </Grid>
    </Fade>
  );
}

export default Bond;
