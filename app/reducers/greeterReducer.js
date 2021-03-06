const defaultState = {
    title: 'spoqn',
    room: '',
    rooms: [],
    friend: '',
    friends: [],
    members: [],
    drawerOpen: false
};

export default function greeterReducer(state = defaultState, action) {
    switch (action.type) {
        case 'SET_DRAWER':
            return {
                ...state,
                drawerOpen: action.drawerOpen
            };
        case 'SET_RM_NAME':
            return {
                ...state,
                room: action.room
            };
        case 'SET_RM_LIST':
            return {
                ...state,
                rooms: action.rooms
            };
        case 'ADD_FRIEND':
            return {
                ...state,
                friend: action.friend
            };
        case 'SET_FRIENDS_LIST':
            return {
                ...state,
                friends: action.friends
            };
        case 'UPDATE_MEMBER_LIST':
            return {
                ...state,
                members: action.members
            };
        default:
            return state;
    }
}