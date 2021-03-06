/* @flow */

import bugsnag from './bugsnag-native';
import regenerator from 'regenerator/runtime';
import React from 'react-native';
import Icon from 'FAKIconImage';
import dedent from 'dedent';
import Parse from './parse';

var {
  AlertIOS,
  AppRegistry,
  AsyncStorage,
  Image,
  LinkingIOS,
  NavigatorIOS,
  PushNotificationIOS,
  StatusBarIOS,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} = React;

ErrorUtils.setGlobalHandler(error => bugsnag.notify(error));

// TODO: Bind

class LondonReact extends React.Component {
  componentWillMount() {
    StatusBarIOS.setStyle('light-content');

    PushNotificationIOS.addEventListener('register', this._savePushToken);
    PushNotificationIOS.addEventListener('notification', this._notificationReceived);
    PushNotificationIOS.requestPermissions(this._savePushToken);
  }
  async _savePushToken(token) {
    await AsyncStorage.setItem('pushToken', token);
    await Parse.registerInstallation(token);
  }
  async _registerInstallation() {
    let pushToken = await AsyncStorage.getItem('pushToken');
    try {
      return await Parse.registerInstallation(pushToken);
    } catch (e) {
      AlertIOS.alert(`Unable to register installation. ${e}`);
    }
  }
  _notificationReceived(notification) {
    AlertIOS.alert(notification);
  }
  render() {
    return (
      <NavigatorIOS
        style={styles.container}
        initialRoute={{
          component: CurrentMeetup,
          title: 'London React Meetup',
        }}
        tintColor="#7ed3f4"
        barTintColor="#1b1d24"
        titleTextColor="#ffffff"
      />
    );
  }
}

class CurrentMeetup extends React.Component {
  state = {
    attending: null
  }

  talks = [
    {
      name: 'Yacine Rezgui',
      title: 'Import.io',
      talk: 'Live coding with Native modules ',
      synopsis: dedent`
        Yacine will create a small application that uses the microphone to do speech to text with a native module communicating to the React code (iOS).
      `,
      bioPic: 'https://pbs.twimg.com/profile_images/533643942131425280/PZbS9agy.jpeg',
      twitter: 'yrezgui',
      github: 'yrezgui'
    },
    {
      name: 'Viktor Charypar',
      title: 'Red Badger',
      talk: 'GraphQL at The Financial Times',
      synopsis: dedent`
        Recently released by Facebook, GraphQL isn't only useful for client-server communication. Viktor will show how Red Badger used the reference implementation - graphql-js - at theFinancial Times as a generic data presentation layer over a set of backend APIs and how to deal with related requirements like caching or authorisation.
      `,
      bioPic: 'https://pbs.twimg.com/profile_images/567296628315267073/BKibFa5T_400x400.jpeg',
      twitter: 'charypar',
      github: 'charypar'
    },
    { name: 'Prospective Speaker', talk: 'Speaking Slot Available', empty: true },
  ];

  constructor() {
    super();
    this._fetchAttendees();
  }

  async _fetchAttendees() {
    const apiKey = process.env.MEETUP_API_KEY;
    const eventId = 224090322;
    const url = `https://api.meetup.com/2/event/${eventId}?key=${apiKey}&sign=true&photo-host=public&page=20`;

    let json;
    try {
      const response = await fetch(url);
      json = await response.json();
    } catch(e) {
      AlertIOS.alert('Failed to fetch attendees');
    }

    this.setState({attending: json.yes_rsvp_count});
  }

  render() {
    return (
      <View style={styles.emptyPage}>
        <Date date="Tuesday, August 4, 2015" />
        <Venue name="Facebook HQ" address="10 Brock Street, Regents Place, London" />
        <Talks talks={this.talks} navigator={this.props.navigator} />
        <Attending count={this.state.attending} />
      </View>
    );
  }
}

// @PureRender / @Debug
class Date extends React.Component {
  _openCalendar() {
    LinkingIOS.openURL('calshow://');
  }
  render() {
    return (
      <TouchableOpacity onPress={this._openCalendar.bind(this)}>
        <View style={styles.section} onPress={this._openCalendar}>
          <StyledText style={styles.sectionTitle}>Date</StyledText>
          <StyledText>{this.props.date}</StyledText>
        </View>
      </TouchableOpacity>
    );
  }
}

class Venue extends React.Component {
  _openMaps() {
    LinkingIOS.openURL('http://maps.apple.com/?q=' + encodeURIComponent(`${this.props.name}, ${this.props.address}`));
  }
  render() {
    return (
      <TouchableOpacity onPress={this._openMaps.bind(this)}>
        <View style={styles.section}>
          <StyledText style={styles.sectionTitle}>Venue</StyledText>
          <StyledText>{this.props.name}</StyledText>
          <StyledText>{this.props.address}</StyledText>
        </View>
      </TouchableOpacity>
    );
  }
}

class Button extends React.Component {
  render() {
    return (
      <TouchableOpacity onPress={this.props.onPress}>
        <View style={[this.props.style, styles.button]}>
          {this.props.icon && <Icon
            name={`fontawesome|${this.props.icon}`}
            size={30}
            color="rgba(255, 255, 255, 0.8)"
            style={styles.icon}
          />}
          <StyledText style={styles.buttonText}>{this.props.text}</StyledText>
        </View>
      </TouchableOpacity>
    );
  }
}

class Twitter extends React.Component {
  _open() {
    const twitterAppURL = `twitter://user?screen_name=${this.props.handle}`;
    const browserURL = `https://twitter.com/${this.props.handle}`;

    LinkingIOS.canOpenURL(twitterAppURL, supported => {
      LinkingIOS.openURL(supported ? twitterAppURL : browserURL);
    });
  }
  render() {
    return (
      <Button icon="twitter" text={`@${this.props.handle}`} onPress={this._open.bind(this)} />
    );
  }
}

class Github extends React.Component {
  _open() {
    LinkingIOS.openURL(`https://github.com/${this.props.handle}`);
  }
  render() {
    return (
      <Button icon="github" text={this.props.handle} onPress={this._open.bind(this)} style={{borderLeftWidth: 1}} />
    );
  }
}

class TalkDetails extends React.Component {
  render() {
    return (
        <View style={styles.emptyPage}>
          <StyledText>{this.props.title}</StyledText>
          <View style={styles.bioContainer}>
            <View>
            <Image
              style={styles.bioPic}
              source={{uri: this.props.speaker.bioPic}}
            />
            </View>
            <StyledText style={styles.sectionTitle}>{this.props.speaker.name}</StyledText>
            <StyledText>{this.props.speaker.title}</StyledText>
            <StyledText style={styles.synopsis} numberOfLines={16}>{this.props.speaker.synopsis}</StyledText>
          </View>
          <View style={styles.buttonContainer}>
          <Twitter handle={this.props.speaker.twitter} />
          <Github handle={this.props.speaker.github} />
          </View>
        </View>
    );
  }
}

class Talks extends React.Component {
  render() {
    return (
      <View style={[styles.section, {flex: 1}]}>
        <StyledText style={styles.sectionTitle}>Talks</StyledText>
        {this.props.talks.map(speaker => <Talk speaker={speaker} navigator={this.props.navigator} />)}
      </View>
     );
  }
}

class Talk extends React.Component {
  _talkDetails() {
    if (this.props.speaker.empty) { return; }

    this.props.navigator.push({
      title: this.props.speaker.talk,
      component: TalkDetails,
      passProps: this.props
    });
  }
  render() {
    const {speaker} = this.props;
    return (
      <TouchableOpacity onPress={this._talkDetails.bind(this)}>
        <View style={styles.talk}>
            <StyledText style={styles.talkTitle}>{speaker.talk}</StyledText>
            <StyledText>{speaker.name}</StyledText>
            <StyledText>{speaker.title}</StyledText>
        </View>
      </TouchableOpacity>
     );
  }
}

class Attending extends React.Component {
  render() {
    return (
      <View style={[styles.section, {borderBottomWidth: 0}]}>
        <StyledText>{this.props.count ? `${this.props.count} Attending` : 'Loading...'}</StyledText>
      </View>
    );
  }
}

class StyledText extends React.Component {
  render() {
    return (
      <Text {...this.props} style={[styles.text, this.props.style]}/>
    );
  }
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1b1d24'
  },
  text: {
    color: 'white'
  },
  emptyPage: {
    flex: 1,
    paddingTop: 64,
    backgroundColor: '#1b1d24',
  },
  emptyPageText: {
    margin: 10,
  },
  section: {
    marginLeft: 20,
    marginRight: 20,
    padding: 20,
    borderBottomWidth: 1,
    borderColor: '#484848'
  },
  talk: {
    paddingTop: 20,
    paddingBottom: 10
  },
  sectionTitle: {
    fontSize: 20,
  },
  talkTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bioContainer: {
    flex: 1,
    alignItems: 'center'
  },
  bioPic: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderColor: 'white',
    borderWidth: 3
  },
  attending: {
    justifyContent: 'center'
  },
  buttonContainer: {
    marginTop: 10,
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
    padding: 5,
  },
  buttonText: {
    color: 'rgba(255, 255, 255, 0.8)'
  },
  icon: {
    width: 30,
    height: 30
  },
  synopsis: {
    margin: 10,
  }
});

AppRegistry.registerComponent('LondonReact', () => LondonReact);
