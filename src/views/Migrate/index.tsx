import { useCallback, useEffect, useRef } from 'react';
import './migrate.scss';
import { useSelector, useDispatch } from 'react-redux';
import { Grid, Box, Paper, TabsActions, Zoom, makeStyles } from '@material-ui/core';
import { formatCurrency, trim } from '../../helpers';
import { approveMigration, approveUnstaking, claimWarmup, migrate, unstake } from '../../store/slices/migrate-thunk';
import { useWeb3Context } from '../../hooks';
import { IPendingTxn, isPendingTxn, txnButtonText } from '../../store/slices/pending-txns-slice';
import { Skeleton } from '@material-ui/lab';
import { IReduxState } from '../../store/slices/state.interface';

const useStyles = makeStyles(theme => ({
  root: {
    '& .MuiOutlinedInput-root': {
      borderColor: 'transparent',
      backgroundColor: theme.palette.background.default,
    },
    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.mode.lightGray300,
    },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.mode.lightGray300,
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.mode.lightGray300,
    },
  },
}));

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

function Migrate() {
  const styles = useStyles();
  const dispatch = useDispatch();
  const { provider, address, connect, chainID } = useWeb3Context();
  const tabsActions = useRef<TabsActions>(null);

  const isAppLoading = useSelector<IReduxState, boolean>(state => state.app.loading);

  const oldClamTotalSupply = useSelector<IReduxState, number>(state => state.app?.oldClamTotalSupply);
  const oldTreasuryBalance = useSelector<IReduxState, number>(state => state.app?.oldTreasuryBalance);

  const clamBalance = useSelector<IReduxState, string>(state => state.account.balances?.clam);
  const oldClamBalance = useSelector<IReduxState, string>(state => state.account.migration?.oldClam);
  const oldSClamBalance = useSelector<IReduxState, string>(state => state.account.migration?.oldSClam);
  const oldWarmupBalance = useSelector<IReduxState, string>(state => state.account.migration?.oldWarmup);
  const canClaimWarmup = useSelector<IReduxState, boolean>(state => state.account.migration?.canClaimWarmup);
  const clamAllowance = useSelector<IReduxState, number>(state => state.account.migration?.clamAllowance);
  const sCLAMAllowance = useSelector<IReduxState, number>(state => state.account.migration?.sCLAMAllowance);
  const pendingTransactions = useSelector<IReduxState, IPendingTxn[]>(state => {
    return state.pendingTransactions;
  });

  const onMigrate = async () => {
    await dispatch(migrate({ address, provider, networkID: chainID }));
  };

  const onUnstake = async () => {
    await dispatch(unstake({ address, value: oldSClamBalance, provider, networkID: chainID }));
  };

  const onClaimWarmup = async () => {
    await dispatch(claimWarmup({ address, provider, networkID: chainID }));
  };

  useEffect(() => {
    if (tabsActions.current) {
      setTimeout(() => tabsActions?.current?.updateIndicator(), 300);
    }
  }, [tabsActions]);

  return (
    <div id="stake-view" className={styles.root}>
      <Zoom in={true}>
        <Paper className="ohm-card">
          <Grid container direction="column" spacing={2}>
            <Grid item>
              <div className="card-header">
                <p className="single-stake-title">Migrate</p>
              </div>
            </Grid>

            <Grid item>
              <div className="stake-top-metrics">
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={6} lg={6}>
                    <div className="stake-apy">
                      <p className="single-stake-subtitle">Old CLAM Supply</p>
                      <Box component="p" color="text.secondary" className="single-stake-subtitle-value">
                        {oldClamTotalSupply ? trim(oldClamTotalSupply, 0) : <Skeleton width="150px" />}
                      </Box>
                    </div>
                  </Grid>

                  <Grid item xs={12} sm={6} md={6} lg={6}>
                    <div className="stake-index">
                      <p className="single-stake-subtitle">Old Treasury Reserve</p>
                      <Box component="p" color="text.secondary" className="single-stake-subtitle-value">
                        {oldTreasuryBalance ? formatCurrency(oldTreasuryBalance, 0) : <Skeleton width="150px" />}
                      </Box>
                    </div>
                  </Grid>
                </Grid>
              </div>
            </Grid>

            <div className="staking-area">
              {!address ? (
                <div className="stake-wallet-notification">
                  <div className="wallet-menu" id="wallet-menu">
                    <Box bgcolor="otter.otterBlue" className="app-otter-button" onClick={connect}>
                      <p>Connect Wallet</p>
                    </Box>
                  </div>
                  <p className="desc-text">Connect your wallet to migrate your CLAM tokens!</p>
                </div>
              ) : (
                <div className={`stake-user-data`}>
                  <div className="data-row">
                    <p className="data-row-name">1. Claim warmup</p>
                    <p className="data-row-value">
                      {isAppLoading ? <Skeleton width="80px" /> : <>{trim(Number(oldWarmupBalance), 4)} sCLAM</>}
                    </p>
                    {Number(oldWarmupBalance) === 0 && <div>DONE</div>}
                    {canClaimWarmup && (
                      <Box
                        className="stake-tab-panel-btn"
                        bgcolor="otter.otterBlue"
                        onClick={() => {
                          if (isPendingTxn(pendingTransactions, 'claimWarmup')) return;
                          onClaimWarmup();
                        }}
                      >
                        <p>{txnButtonText(pendingTransactions, 'claimWarmup', 'Claim Warmup')}</p>
                      </Box>
                    )}
                  </div>

                  <div className="data-row">
                    <p className="data-row-name">2. Unstake CLAM</p>
                    <p className="data-row-value">
                      {isAppLoading ? <Skeleton width="80px" /> : <>{trim(Number(oldSClamBalance), 4)} sCLAM</>}
                    </p>
                    {+oldSClamBalance === 0 && <p>DONE</p>}
                    {+oldSClamBalance > 0 &&
                      (sCLAMAllowance > 0 ? (
                        <Box
                          className="stake-tab-panel-btn"
                          bgcolor="otter.otterBlue"
                          onClick={() => {
                            if (isPendingTxn(pendingTransactions, 'unstaking')) return;
                            onUnstake();
                          }}
                        >
                          <p>{txnButtonText(pendingTransactions, 'unstaking', 'Unstake CLAM')}</p>
                        </Box>
                      ) : (
                        <Box
                          className="stake-tab-panel-btn"
                          bgcolor="otter.otterBlue"
                          onClick={() => {
                            if (isPendingTxn(pendingTransactions, 'approve_unstaking')) return;
                            dispatch(approveUnstaking({ address, provider, networkID: chainID }));
                          }}
                        >
                          <p>{txnButtonText(pendingTransactions, 'approve_unstaking', 'Approve')}</p>
                        </Box>
                      ))}
                  </div>

                  <div className="data-row">
                    <p className="data-row-name">3. Migrate CLAM to CLAM2</p>
                    <p className="data-row-value">
                      {isAppLoading ? <Skeleton width="80px" /> : <>{trim(Number(oldClamBalance), 4)} CLAM</>}
                    </p>
                    {+oldClamBalance > 0 &&
                      (clamAllowance >= +oldClamBalance ? (
                        <Box
                          className="stake-tab-panel-btn"
                          bgcolor="otter.otterBlue"
                          onClick={() => {
                            if (isPendingTxn(pendingTransactions, 'migrating')) return;
                            onMigrate();
                          }}
                        >
                          <p>{txnButtonText(pendingTransactions, 'migrating', 'Migrate')}</p>
                        </Box>
                      ) : (
                        <Box
                          className="stake-tab-panel-btn"
                          bgcolor="otter.otterBlue"
                          onClick={() => {
                            if (isPendingTxn(pendingTransactions, 'approve_migration')) return;
                            dispatch(approveMigration({ address, provider, networkID: chainID }));
                          }}
                        >
                          <p>{txnButtonText(pendingTransactions, 'approve_migration', 'Approve')}</p>
                        </Box>
                      ))}
                  </div>

                  <div className="data-row">
                    <p className="data-row-name">Your CLAM2 Balance</p>
                    <p className="data-row-value">
                      {isAppLoading ? <Skeleton width="80px" /> : <>{trim(Number(clamBalance), 4)} CLAM2</>}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Grid>
        </Paper>
      </Zoom>
    </div>
  );
}

export default Migrate;
