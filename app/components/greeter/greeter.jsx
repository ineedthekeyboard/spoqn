import React from 'react';
import ReactDOM from 'react-dom';
import {connect} from 'react-redux';
import {push} from 'react-router-redux';
import {withRouter} from 'react-router-dom'
import PropTypes from 'prop-types';
import {Provider} from 'react-redux';
import moment from 'moment';
import io from 'socket.io-client';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import Messenger from 'Components/messenger/messenger';
import PromptDialog from 'Widgets/promptDialog/promptDialog';
import AlertDialog from 'Widgets/alertDialog/alertDialog';
import Help from 'Components/help/help';
import FriendCard from 'Widgets/friendCard/friendCard';
import services from 'Services';
import serviceManager from 'ServiceManager';

import FlatButton from 'material-ui/FlatButton';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import {List, ListItem} from 'material-ui/List';
import Drawer from 'material-ui/Drawer';
import AppBar from 'material-ui/AppBar';
import Divider from 'material-ui/Divider';
import TextField from 'material-ui/TextField';
import Subheader from 'material-ui/Subheader';
import IconButton from 'material-ui/IconButton';

import GroupAddIcon from 'material-ui/svg-icons/social/group-add';
import AddIcon from 'material-ui/svg-icons/content/add';
import PencilIcon from 'material-ui/svg-icons/content/create';
import BlockIcon from 'material-ui/svg-icons/content/block';
import RefreshIcon from 'material-ui/svg-icons/navigation/refresh';
import HelpIcon from 'material-ui/svg-icons/action/help';
import InfoIcon from 'material-ui/svg-icons/action/info-outline';
import DeleteIcon from 'material-ui/svg-icons/action/delete-forever';

import './greeter.css';

const groupAddIconStyles = {
    fill: '#FFFFFF',
    height: 30,
    width: 30,
    marginRight: 15,
    verticalAlign: 'middle',
    cursor: 'pointer'
};

const flatButtonStyles = {
    color: '#FFFFFF',
    borderLeft: '1px white solid'
};

const iconMenuStyles = {
    marginTop: '5px'
};

const convoInfoIconStyles = {
    fill: 'rgb(117, 117, 117)',
};

const convoIconMenuStyles = {
    width: 24,
    height: 24,
    padding: 0,
    fill: 'rgb(117, 117, 117)',
};

class Greeter extends React.Component {
    constructor(props) {
        super(props);

        this._initializeSocket();
    }

    componentDidMount() {
        this._getRooms();
    }

    _initializeSocket() {
        let token = localStorage.getItem('token'),
            socketURL = '/spoqn/messenger/chat';

        this.socket = io(socketURL, {
            query: 'token=' + token
        });
    }

    toggleDrawer() {
        let prevState = this.context.store.getState().greeterReducer.drawerOpen;

        this.props.dispatch({
            type: 'SET_DRAWER',
            drawerOpen: !prevState
        });
    }

    handleLogOut() {
        let self = this;

        localStorage.removeItem('token');

        self.props.dispatch({
            type: 'SET_AUTH',
            auth: ''
        });

        self.context.store.dispatch(push('/login'));
    }

    handleRefresh() {
        location.reload();
    }

    handleHelp() {
        ReactDOM.render(<Help/>, document.getElementById('overlay'));
    }

    handleRoomNameChange(evt) {
        this.props.dispatch({
            type: 'SET_RM_NAME',
            room: evt.currentTarget.value
        });
    }

    createRoom() {
        let self = this,
            state = this.context.store.getState().greeterReducer,
            token = localStorage.getItem('token'),
            options = {
                headers: {
                    Authorization: token
                },
                data: {
                    name: state.room
                },
                url: services.room.create
            };

        serviceManager.post(options).then(function (response) {
            (response.success) ? self._handleCreateSuccess(response) : self._handleCreateFailure(response);
        }).catch(self._handleCreateFailure.bind(self));
    }

    handleCreateRoomClick() {
        let self = this,
            props = {
                width: 500,
                title: 'Create A Room',
                successLabel: 'Create',
                proceedCB: self.createRoom.bind(self),
                content: () => {
                    return (<TextField
                        floatingLabelText="Room Name"
                        onChange={self.handleRoomNameChange.bind(self)}
                    />)
                }
            },
            container = document.querySelector('#overlay');

        ReactDOM.unmountComponentAtNode(container);
        ReactDOM.render(<PromptDialog {...props} />, container);
    }

    _handleCreateSuccess(response) {
        this._handleFetchSuccess(response);
    }

    _handleCreateFailure(response) {
        console.log(response);
    }

    openRoom(room) {
        let container = document.getElementsByClassName('messenger')[0];

        this.socket.removeAllListeners();

        ReactDOM.unmountComponentAtNode(container);
        ReactDOM.render(<Provider store={this.context.store}><MuiThemeProvider><Messenger
            roomName={room.name} roomID={room._id} socket={this.socket}/></MuiThemeProvider>
        </Provider>, container);
    }

    _getRooms() {
        let self = this,
            token = localStorage.getItem('token'),
            options = {
                headers: {
                    Authorization: token
                },
                url: services.room.allRooms
            };

        serviceManager.get(options).then(function (response) {
            (response.success) ? self._handleFetchSuccess(response) : self._handleFetchFailure(response);
        }).catch(self._handleFetchFailure.bind(self));
    }

    _handleFetchSuccess(response) {
        let container = document.getElementsByClassName('messenger')[0];

        this.props.dispatch({
            type: 'SET_RM_LIST',
            rooms: response.rooms
        });

        this.socket.removeAllListeners();

        if (response.rooms.length) {
            ReactDOM.unmountComponentAtNode(container);
            ReactDOM.render(<Provider store={this.context.store}><MuiThemeProvider><Messenger
                roomName={response.rooms[0].name} roomID={response.rooms[0]._id}
                socket={this.socket}/></MuiThemeProvider>
            </Provider>, container);
        }
    }

    _handleFetchFailure(response) {
        console.log(response);
    }

    handleAddFriendClick() {
        let self = this,
            props = {
                width: 500,
                title: 'Add Friend',
                successLabel: 'Add',
                proceedCB: self.addFriend.bind(self),
                content: () => {
                    return (<TextField
                        floatingLabelText="E-mail Address"
                        onChange={self.handleFriendEmailChange.bind(self)}
                    />)
                }
            },
            container = document.getElementById('overlay');

        ReactDOM.unmountComponentAtNode(container);
        ReactDOM.render(<PromptDialog {...props} />, container);
    }

    handleFriendEmailChange(evt) {
        this.props.dispatch({
            type: 'ADD_FRIEND',
            friend: evt.currentTarget.value
        });
    }

    addFriend() {
        let self = this,
            state = this.context.store.getState().greeterReducer,
            token = localStorage.getItem('token'),
            options = {
                headers: {
                    Authorization: token
                },
                data: {
                    friend: state.friend
                },
                url: services.friend.add
            };

        serviceManager.post(options).then(function (response) {
            (response.success) ? self._handleAddFriendSuccess(response) : self._handleAddFriendFailure(response);
        }).catch(self._handleAddFriendFailure.bind(self));
    }

    _handleAddFriendSuccess() {

    }

    _handleAddFriendFailure() {

    }

    handleEditMembersClick(roomID, roomName) {
        let self = this,
            members,
            friends,
            container = document.getElementById('overlay'),
            content = (friends) => {
                return (
                    friends.map(function (friend) {
                        return <FriendCard username={friend.username} email={friend.email} key={friend._id}
                                           handleAdd={self.addMember.bind(self, friend, roomID)}
                                           handleRemove={self.removeMember.bind(self, friend, roomID)}
                                           friends={friends} members={members}
                        />
                    })
                )
            },
            closeCB = () => {
            };

        this.getMembers(roomID).then(function (response) {
            members = response.members;

            self._getFriends().then(function (response) {
                friends = response.friends;

                ReactDOM.unmountComponentAtNode(container);
                ReactDOM.render(<AlertDialog title={'Edit ' + roomName + ' Members'} content={content(friends)}
                                             closeCB={closeCB.bind(self)} style={{minWidth: 400}}
                                             label="Done" customClass={'edit-friends'}/>, container);
            });
        });
    }

    addMember(friend, roomID) {
        let self = this,
            token = localStorage.getItem('token'),
            options = {
                headers: {
                    Authorization: token
                },
                data: {
                    member: friend,
                    roomID: roomID
                },
                url: services.room.addMember
            },
            promise = serviceManager.post(options);

        promise.then(function (response) {
            (response.success) ? self._handleAddMemberSuccess(response) : self._handleAddMemberFailure(response);
        }).catch(self._handleAddFriendFailure.bind(self));

        return promise;
    }

    _handleAddMemberSuccess(response) {
        this.props.dispatch({
            type: 'UPDATE_MEMBER_LIST',
            members: response.members
        });
    }

    _handleAddMemberFailure() {

    }

    getMembers(roomID) {
        let self = this,
            token = localStorage.getItem('token'),
            options = {
                headers: {
                    Authorization: token
                },
                url: services.room.getMembers.replace(':id', roomID)
            },
            promise = serviceManager.get(options);

        promise.then(function (response) {
            if (response.success) {
                self._handleMemberLoadSuccess(response);
            } else {
                self._handleMemberLoadFailure(response);
            }
        }).catch(self._handleMemberLoadFailure.bind(self));

        return promise;
    }

    _handleMemberLoadSuccess(response) {
        this.props.dispatch({
            type: 'UPDATE_MEMBER_LIST',
            members: response.members
        });
    }

    _handleMemberLoadFailure() {

    }

    removeMember(friend, roomID) {
        let self = this,
            token = localStorage.getItem('token'),
            options = {
                headers: {
                    Authorization: token
                },
                data: {
                    member: friend,
                    roomID: roomID
                },
                url: services.room.removeMember
            },
            promise = serviceManager.post(options);

        promise.then(function (response) {
            (response.success) ? self._handleRemoveMemberSuccess(response) : self._handleRemoveMemberFailure(response);
        }).catch(self._handleRemoveMemberFailure.bind(self));

        return promise;
    }

    _handleRemoveMemberSuccess(response) {
        this.props.dispatch({
            type: 'UPDATE_MEMBER_LIST',
            members: response.members
        });
    }

    _handleRemoveMemberFailure() {

    }

    _getFriends() {
        let self = this,
            token = localStorage.getItem('token'),
            options = {
                headers: {
                    Authorization: token
                },
                url: services.friend.getAll
            },
            promise = serviceManager.get(options);

        promise.then(function (response) {
            (response.success) ? self._handleFriendsLoadSuccess(response) : self._handleFriendsLoadFailure(response);
        }).catch(self._handleFriendsLoadFailure.bind(self));

        return promise;
    }

    _handleFriendsLoadSuccess(response) {
        this.props.dispatch({
            type: 'SET_FRIENDS_LIST',
            friends: response.friends
        });
    }

    _handleFriendsLoadFailure() {

    }

    render() {
        return (
            <div className='greeter-component'>
                <div className='app-bar'>
                    <AppBar title={this.context.store.getState().greeterReducer.title} style={{height: '65px'}}
                            iconElementRight={
                                <div>
                                    <GroupAddIcon style={groupAddIconStyles}
                                                  onClick={this.handleAddFriendClick.bind(this)}/>
                                    <Logged label={this.context.store.getState().authReducer.username}
                                            data-refresh={this.handleRefresh.bind(this)}
                                            data-logout={this.handleLogOut.bind(this)}
                                            data-help={this.handleHelp.bind(this)}/>
                                </div>
                            }
                            onLeftIconButtonClick={this.toggleDrawer.bind(this)}>
                    </AppBar>
                </div>
                <div className='drawer'>
                    <Drawer open={this.context.store.getState().greeterReducer.drawerOpen} width={350}
                            containerStyle={{height: 'calc(100% - 67px)', top: 66, left: 0}}>
                        <MenuItem onClick={this.handleCreateRoomClick.bind(this)} rightIcon={<AddIcon/>}>Create
                            Room</MenuItem>
                        <Divider/>
                        <Subheader>Conversations
                            ({this.context.store.getState().greeterReducer.rooms.length})</Subheader>
                        <List>
                            {this.context.store.getState().greeterReducer.rooms.map((room) =>
                                (<div key={room._id}>
                                    <ListItem onClick={this.openRoom.bind(this, room)}
                                              rightIcon={<ConversationMenu
                                                  data-edit-members={this.handleEditMembersClick.bind(this, room._id, room.name)}/>}
                                              primaryText={room.name}
                                              secondaryText={moment(room.updatedAt).format('MMM Do YYYY, h:mm a')}/>
                                    <Divider inset={true}/>
                                </div>)
                            )}
                        </List>
                    </Drawer>
                </div>
                <div className='messenger'>
                </div>
            </div>
        );
    }
}

const Logged = (props) => (
    <IconMenu {...props} style={iconMenuStyles}
              iconButtonElement={<FlatButton label={props.label} style={flatButtonStyles}/>}
              targetOrigin={{horizontal: 'right', vertical: 'top'}}
              anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}>
        <MenuItem onClick={props['data-refresh']} primaryText='Refresh' rightIcon={<RefreshIcon/>}/>
        <MenuItem onClick={props['data-help']} primaryText='Help' rightIcon={<HelpIcon/>}/>
        <MenuItem onClick={props['data-logout']} primaryText='Log Out' rightIcon={<BlockIcon/>}/>
    </IconMenu>
);

const ConversationMenu = (props) => (
    <IconMenu {...props} iconButtonElement={<IconButton style={convoIconMenuStyles} onClick={(evt) => {
        evt.stopPropagation()
    }}>
        <div><InfoIcon style={convoInfoIconStyles}/></div>
    </IconButton>}
              targetOrigin={{horizontal: 'left', vertical: 'top'}}
              anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}>
        <MenuItem disabled={true} onClick={props['data-rename']} primaryText='Rename Room' rightIcon={<PencilIcon/>}/>
        <MenuItem disabled={true} onClick={props['data-delete']} primaryText='Delete Room' rightIcon={<DeleteIcon/>}/>
        <MenuItem onClick={props['data-edit-members']} primaryText='Edit Members' rightIcon={<GroupAddIcon/>}/>
    </IconMenu>
);

Greeter.propTypes = {
    title: PropTypes.string,
    room: PropTypes.string,
    rooms: PropTypes.array,
    friend: PropTypes.string,
    friends: PropTypes.array,
    members: PropTypes.array,
    drawerOpen: PropTypes.bool
};

Greeter.contextTypes = {
    store: PropTypes.object
};

function mapStateToProps(state) {
    return {
        title: state.greeterReducer.title,
        room: state.greeterReducer.room,
        rooms: state.greeterReducer.rooms,
        friend: state.greeterReducer.friend,
        friends: state.greeterReducer.friends,
        members: state.greeterReducer.members,
        drawerOpen: state.greeterReducer.drawerOpen
    };
}

export default withRouter(connect(mapStateToProps)(Greeter))