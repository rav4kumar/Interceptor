import React, { Component, Fragment } from 'react';
import propTypes from 'prop-types';

import GraphDashboard from './Graphs/GraphDashboard';
import Joystick from './Joystick/Joystick';
import { TabPanel } from './TabPanel';
import { WebSocketHelper } from './helpers/WebSocketHelper';
import { MainSettings } from './MainSettings';

import { withStyles } from '@material-ui/core/styles';
import {
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Badge,
  Box
} from '@material-ui/core';

import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import IconButton from '@material-ui/core/IconButton';
import SettingsIcon from '@material-ui/icons/Settings';
import SignalWifi0BarIcon from '@material-ui/icons/SignalWifi0Bar';
import SignalWifi4BarIcon from '@material-ui/icons/SignalWifi4Bar';
import SignalWifiOffIcon from '@material-ui/icons/SignalWifiOff';

import { ThemeProvider } from "@material-ui/styles";
import { createMuiTheme } from "@material-ui/core/styles";

const styles = {
  iconSpaced: {
    padding: '0 40px 0 0',
  },
  mainTabs: {
    flexGrow: 1,
  },
};

const theme = createMuiTheme ({
  palette:{
     type: "light",
  },
  typography: {
    "fontFamily": `"Roboto", "Helvetica", "Arial", sans-serif`,
    "fontSize": 14,
    "fontWeightLight": 300,
    "fontWeightRegular": 400,
    "fontWeightMedium": 500
   }
});


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedTab: 1,
      show_mainsettings: false,
      ws_url: 'ws://192.168.43.1:4545',
      rateHz: 20,
      render_revision: 0,
    };
    this.wshelper = React.createRef();
    this.pushgraphdata = React.createRef();
  }

  ws_status = '';
  sent_count = 0;
  received_count = 0;

  componentDidMount() {
    this.render_delay = setInterval(this.renderDelay, 1000 / this.state.rateHz);
  }

  shouldComponentUpdate(prevProps, prevState) {
    return prevState.render_revision !== this.state.render_revision;
  }

  renderDelay = () => {
    clearInterval(this.render_delay);
    this.setState({ render_revision: this.state.render_revision + 1 });
    this.render_delay = setInterval(this.renderDelay, 1000 / this.state.rateHz)
  }

  messageProcess = msg_recv => { // Received messages must be pushed to child component for better performance
    if (this.received_count > 9999) this.received_count = 0;
    this.received_count += 1;
    if (this.pushgraphdata.current) this.pushgraphdata.current.messageProcess(msg_recv);
  }

  sendWSmsg = msg => {
    if (this.sent_count > 9999) this.sent_count = 0;
    this.sent_count += 1;
    this.wshelper.current.sendMessage(msg);
  };

  connectionStatus = () => {
    if (this.ws_status === "connected") return <SignalWifi4BarIcon />;
    else if (this.ws_status === "connecting") return <SignalWifi0BarIcon />;
    else return <SignalWifiOffIcon />;
  }

  a11yProps = index => {
    return {
      id: `plugin-tab-${index}`,
      'aria-controls': `plugin-tabpanel-${index}`,
    };
  }

  render() {
    //console.log("Rendering App");
    const { classes } = this.props;
    return (
      <Fragment>
        <ThemeProvider theme = {theme}>
        <WebSocketHelper
          ws_url={this.state.ws_url}
          messageProcess={this.messageProcess}
          ref={this.wshelper}
          status={status => this.ws_status = status}
        />
        <AppBar position="sticky" color="inherit">
          <Toolbar>
            <Tabs
              className={classes.mainTabs}
              value={this.state.selectedTab}
              onChange={(event, newValue) => this.setState({ selectedTab: newValue })}
              indicatorColor="secondary"
              textColor="primary"
              variant="scrollable"
              scrollButtons="auto"
              aria-label="Plugins tabs"
            >
              <Tab label="Dashboard" disabled {...this.a11yProps(0)} />
              <Tab label="Graphs" {...this.a11yProps(1)} />
              <Tab label="Joystick" {...this.a11yProps(2)} />
              <Tab label="OP Edit" disabled {...this.a11yProps(3)} />
              <Tab label="CAN BUS" disabled {...this.a11yProps(4)} />
            </Tabs>
            <Box className={classes.iconSpaced}>
              <Badge anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
                badgeContent={this.received_count}
                color="secondary"
                showZero max={9999}
              >
                <ArrowDownwardIcon color="inherit"/>
              </Badge>
            </Box>
            <Box className={classes.iconSpaced}>
              <Badge anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
                badgeContent={this.sent_count}
                color="secondary"
                showZero max={9999}
              >
                <ArrowUpwardIcon color="inherit"/>
              </Badge>
            </Box>
            {this.connectionStatus()}
            <IconButton onClick={() => { this.setState({ show_mainsettings: true }) }} aria-label="WebSocket connection status" component="span" color="inherit">
              <SettingsIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <TabPanel value={this.state.selectedTab} index={0}>
          Dashboard will be here
      </TabPanel>
        <TabPanel value={this.state.selectedTab} index={1}>
          <GraphDashboard ref={this.pushgraphdata} />
        </TabPanel>
        <TabPanel value={this.state.selectedTab} index={2}>
          <Joystick procData={data => this.sendWSmsg(data)} />
        </TabPanel>
        <TabPanel value={this.state.selectedTab} index={3}>
          OP_Edit will be here
      </TabPanel>
        <TabPanel value={this.state.selectedTab} index={4}>
          CAN messages will be here
      </TabPanel>
      {this.state.show_mainsettings ? (
          <MainSettings
            setSettings={(ws_url, rate) => this.setState({ show_mainsettings: false, ws_url: ws_url, rateHz: rate })}
            show={this.state.show_mainsettings}
            ws_url={this.state.ws_url}
            rateHz={this.state.rateHz}
          />
        ) : (null)}
      </ThemeProvider>
      </Fragment>
    );
  }
}

App.propTypes = {
  classes: propTypes.object.isRequired,
}

export default withStyles(styles)(App);
