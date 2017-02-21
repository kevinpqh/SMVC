(function () {
angular 
    .module('loc8rApp')
    .controller('homeCtrl', homeCtrl);
homeCtrl.$inject = ['$scope', 'loc8rData', 'geolocation','authentication'];
function homeCtrl ($scope, loc8rData, geolocation,authentication) {
    var vm = this;
    vm.pageHeader = {
        title: 'Loc8r',
        strapline: 'Find places to work with wifi near you!'
    };
    vm.sidebar = {
        content: "Looking for wifi and a seat etc etc"
    };

    vm.message = "Checking your location";

    vm.currentUser = authentication.currentUser();
    
    // vm.getData = function (position) {
    //     var lat = position.coords.latitude,
    //     lng = position.coords.longitude;
    //     vm.message = "Searching for nearby places";
    //     loc8rData.locationByCoords(lat, lng)
    //     .success(function(data) {
    //         vm.message = data.length > 0 ? "" : "No locations found nearby";
    //         vm.data = { locations: data };
    //     })
    //     .error(function (e) {
    //         vm.message = "Sorry, something's gone wrong";
    //     });
    // };
    
    // vm.showError = function (error) {
    //     $scope.$apply(function() {
    //         vm.message = error.message;
    //     });
    // };
    
    // vm.noGeo = function () {
    //     $scope.$apply(function() {
    //         vm.message = "Geolocation is not supported by this browser.";
    //     });
    // };
    // geolocation.getPosition(vm.getData,vm.showError,vm.noGeo);

    var room;
    var users = {};
    var dataChannels = {};

    // when Bistri API client is ready, function
    // "onBistriConferenceReady" is invoked
    onBistriConferenceReady = function () {

        // test if the browser is WebRTC compatible
        if ( !BistriConference.isCompatible() ) {
            // if the browser is not compatible, display an alert
            alert( "your browser is not WebRTC compatible !" );
            // then stop the script execution
            return;
        }

        BistriConference.signaling.addHandler( "onConnected", function () {
            // show pane with id "pane_1"
            showPanel( "pane_1" );
        } );

        // when an error occured on the server side
        BistriConference.signaling.addHandler( "onError", function () {
            // display an alert message
            alert( error.text + " (" + error.code + ")" );
        } );

        // when the user has joined a room
        BistriConference.signaling.addHandler( "onJoinedRoom", function ( data ) {
            // set the current room name
            room = data.room;
            // show pane with id "pane_2"
            showPanel( "pane_2" );
            // then, for every single members already present in the room ...
            for ( var i=0, max=data.members.length; i<max; i++ ) {
                // set a couple id/nickname to "users" object
                users[ data.members[ i ].id ] = data.members[ i ].name;
                // ... open a data channel
                BistriConference.openDataChannel( data.members[ i ].id, "chat", data.room );
            }
        } );

        // when an error occurred while trying to join a room
        BistriConference.signaling.addHandler( "onJoinRoomError", function ( error ) {
            // display an alert message
            alert( error.text + " (" + error.code + ")" );
        } );

        // when the local user has quitted the room
        BistriConference.signaling.addHandler( "onQuittedRoom", function( room ) {
            // show pane with id "pane_1"
            showPanel( "pane_1" );
            // stop the local stream
            BistriConference.stopStream();
        } );

        // when a remote user has joined a room in which the local user is in
        BistriConference.signaling.addHandler( "onPeerJoinedRoom", function ( peer ) {
            // set a couple id/nickname to "users" object
            users[ peer.pid ] = peer.name;
        } );

        // when a remote user has quitted a room in which the local user is in
        BistriConference.signaling.addHandler( "onPeerQuittedRoom", function ( peer ) {
            // delete couple id/nickname in "users" object
            delete users[ peer.pid ];
        } );

        // when the local user has created a data channel, invoke "onDataChannel" callback
        BistriConference.channels.addHandler( "onDataChannelCreated", onDataChannel );

        // when the remote user has created a data channel, invoke "onDataChannel" callback
        BistriConference.channels.addHandler( "onDataChannelRequested", onDataChannel );

        // bind function "setNickname" to button "Set Nickname"
        //q( "#nick" ).addEventListener( "click", setNickname );

        setNickname();

        // bind function "joinChatRoom" to button "Join Chat Room"
        q( "#join" ).addEventListener( "click", joinChatRoom );

        // bind function "quitChatRoom" to button "Quit Chat Room"
        q( "#quit" ).addEventListener( "click", quitChatRoom );

        // bind function "sendChatMessage" to button "Send Message"
        q( "#send" ).addEventListener( "click", sendChatMessage );

    }
    function onDataChannel( dataChannel, remoteUserId ){

        // when the data channel is open
        dataChannel.onOpen = function(){
            // set a couple id/datachannel to "dataChannels" object
            dataChannels[ remoteUserId ] = this;
            // check chat partner presence
            isThereSomeone();
        };

        // when the data channel is closed
        dataChannel.onClose = function(){
            // delete couple id/datachannel from "dataChannels" object
            delete dataChannels[ remoteUserId ];
            // check chat partner presence
            isThereSomeone();
        };

        // when a message is received from the data channel
        dataChannel.onMessage = function( event ){
            // display the received message
            displayMessage( users[ remoteUserId ], event.data );
        };

    }

    // when button "Set Nickname" has been clicked
    function setNickname(){
        // get nickname field content
        //var nickname = q( "#nick_field" ).value;
        var nickname = vm.currentUser.name;
        // if a nickname has been set ...
        if( nickname ){
            // initialize API client with application keys and nickname
            // if you don't have your own, you can get them at:
            // https://api.developers.bistri.com/login
            BistriConference.init( {
                appId: "7a5eebc7",
                appKey: "4465c0d6fb1f64b3d870e90e93080b57",
                userName: nickname,
                debug: true
            } );
            // open a new session on the server
            BistriConference.connect();
        }
        else{
            // otherwise, display an alert
            alert( "you must enter a nickname !" );
        }
    }

    // when button "Join Chat Room" has been clicked
    function joinChatRoom(){
        // get chat room field content
        //var roomToJoin = q( "#room_field" ).value;
        var roomToJoin = vm.formData.numero;

        vm.makeCall();
        // if a chat room name has been set ...
        if( roomToJoin ){
            // ... join the room
            BistriConference.joinRoom( roomToJoin );
        }
        else{
            // otherwise, display an alert
            alert( "you must enter a room name !" );
        }
    }

    // when button "Quit Chat Room" has been clicked
    function quitChatRoom(){
        // for each data channel present in "dataChannels" object ...
        for( var id in dataChannels ){
            // ... close the data channel
            dataChannels[ id ].close();
        }
        // and quit chat room
        BistriConference.quitRoom( room );
    }

    // when button "Send Message" has been clicked
    function sendChatMessage(){
        // get message field content
        var message = q( "#message_field" ).value;
        // if a chat room name has been set ...
        if( message ){
            // for each data channel present in "dataChannels" object ...
            for( var id in dataChannels ){
                // ... send a message
                dataChannels[ id ].send( message );
            }
            // display the sent message
            displayMessage( "me", message );
            // reset message field content
            q( "#message_field" ).value = "";
        }
    }

    // when a message must be dislpayed
    function displayMessage( user, message ){
        // create a message node and insert it in div#messages_container node
        var container = q( "#messages_container" );
        var textNode = document.createTextNode( user + " > " + message );
        var node = document.createElement( "div" );
        node.className = "message";
        node.appendChild( textNode );
        container.appendChild( node );
        // scroll to bottom to always display the last message
        container.scrollTop = container.scrollHeight;
    }

    // when checking for chat partner presence
    function isThereSomeone(){
        // if "dataChannels" object contains one or more data channel objects ...
        if( Object.keys( dataChannels ).length ){
            // ... enabled "Send Message" button
            q( "#send" ).removeAttribute( "disabled" );
        }
        else{
            // otherwise disable "Send Message" button
            q( "#send" ).setAttribute( "disabled", "disabled" );
        }
    }

    function showPanel( id ){
        var panes = document.querySelectorAll( ".pane" );
        // for all nodes matching the query ".pane"
        for( var i=0, max=panes.length; i<max; i++ ){
            // hide all nodes except the one to show
            panes[ i ].style.display = panes[ i ].id == id ? "block" : "none";
        }
    }

    function q( query ){
        // return the DOM node matching the query
        return document.querySelector( query );
    }

    onBistriConferenceReady();

    //videoconference = function (){

        var video_out = document.getElementById("vid-box");
        var vid_thumb = document.getElementById("video-display");
        var vidCount  = 0;
    
        vm.login = function () {
            var phone = window.phone = PHONE({
                //number        : form.username.value || "Anonymous", // listen on username line else Anonymous
                number        : vm.currentUser.email || "Anonymous", // listen on username line else Anonymous
                publish_key   : 'pub-c-561a7378-fa06-4c50-a331-5c0056d0163c', // Your Pub Key
                subscribe_key : 'sub-c-17b7db8a-3915-11e4-9868-02ee2ddab7fe', // Your Sub Key
                ssl           : true
            });
            var ctrl = window.ctrl = CONTROLLER(phone, get_xirsys_servers);
            ctrl.ready(function(){
                //form.username.style.background="#55ff5b"; 
                //form.login_submit.hidden="true"; 
                ctrl.addLocalStream(vid_thumb);
                //addLog("Logged in as " + form.username.value); 
            });
            ctrl.receive(function(session){
                session.connected(function(session){ video_out.appendChild(session.video); /*addLog(session.number + " has joined."); vidCount++;*/ });
                session.ended(function(session) { ctrl.getVideoElement(session.number).remove();/*addLog(session.number + " has left.");    vidCount--;*/});
            });
            ctrl.videoToggled(function(session, isEnabled){
                ctrl.getVideoElement(session.number).toggle(isEnabled);
                //addLog(session.number+": video enabled - " + isEnabled);
            });
            ctrl.audioToggled(function(session, isEnabled){
                ctrl.getVideoElement(session.number).css("opacity",isEnabled ? 1 : 0.75);
                //addLog(session.number+": audio enabled - " + isEnabled);
            });
            return false;
        }
        
        vm.makeCall = function (){
            if (!window.phone) alert("Login First!");
            //var num = form.number.value;
            var num = vm.formData.numero;
            if (phone.number()==num) return false; // No calling yourself!
            ctrl.isOnline(num, function(isOn){
                if (isOn) ctrl.dial(num);
                else alert("User if Offline");
            });
            return false;
        }

        vm.mute = function(){
        	var audio = ctrl.toggleAudio();
        	if (!audio) $("#mute").html("Unmute");
        	else $("#mute").html("Mute");
        }

        vm.end = function (){
        	ctrl.hangup();
        }

        vm.pause = function (){
        	var video = ctrl.toggleVideo();
        	if (!video) $('#pause').html('Unpause'); 
        	else $('#pause').html('Pause'); 
        }

        function getVideo(number){
        	return $('*[data-number="'+number+'"]');
        }

        function addLog(log){
        	$('#logs').append("<p>"+log+"</p>");
        }

        function get_xirsys_servers() {
            var servers;
            $.ajax({
                type: 'POST',
                url: 'https://service.xirsys.com/ice',
                data: {
                    room: 'default',
                    application: 'default',
                    domain: 'kevingleason.me',
                    ident: 'gleasonk',
                    secret: 'b9066b5e-1f75-11e5-866a-c400956a1e19',
                    secure: 1,
                },
                success: function(res) {
                    console.log(res);
                    res = JSON.parse(res);
                    if (!res.e) servers = res.d.iceServers;
                },
                async: false
            });
            return servers;
        }

        function errWrap(fxn, form){
        	try {
        		return fxn(form);
        	} catch(err) {
        		alert("WebRTC is currently only supported by Chrome, Opera, and Firefox");
        		return false;
        	}
        }
        
        //vm.onSubmit = function () {
        //

    //}
    
    //videoconference();
    //vm.conectarse = login();
    

};

})();