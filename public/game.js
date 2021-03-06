var checkPoolRunning = false;
var checkPoolGameSpeed = gameSpeed;
var cancelCheckPool = false;

var rematchPoolRunning = false;
var cancelRematchPool = false;
var boardSize = 8;
var ranks = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
var files = [1, 2, 3, 4, 5, 6, 7, 8];
if (gameType == '4way') {
    boardSize = 12;
    ranks = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];
    files = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
}

function checkPool(originalThread = false) {
    if (cancelCheckPool) {
        checkPoolRunning = false;
        cancelCheckPool = false;
        return ;
    }
    var setInterval = originalThread;
    if (checkPoolRunning == false) {
        checkPoolRunning = true;
        setInterval = true;
    }
    $.ajax({
        type : 'GET',
        url  : '/ajax/pool/' + checkPoolGameSpeed,
        dataType : 'json',
        success : function(data){
            var jsonRes = data;
            if (jsonRes.hasOwnProperty('gameId')) {
                window.location.replace('/game/' + jsonRes.gameId);
            }
            if (setInterval) {
                intervalPlayer = setTimeout(
                    function() {
                        checkPool(true);
                    },
                    2000
                );
            }
        }
    });
}

function rematchPool(originalThread = false) {
    if (cancelRematchPool) {
        console.log("canceling rematch pool");
        rematchPoolRunning = false;
        cancelRematchPool = false;
        return ;
    }
    var setInterval = originalThread;
    if (rematchPoolRunning == false) {
        console.log("setting rematch interval");
        rematchPoolRunning = true;
        setInterval = true;
    }
    $.ajax({
        type : 'GET',
        url  : '/ajax/rematch?gameId=' + gameId,
        dataType : 'json',
        success : function(data){
            var jsonRes = data;
            if (jsonRes.hasOwnProperty('gameId')) {
                window.location.replace('/game/' + jsonRes.gameId);
            }
            if (setInterval) {
                intervalPlayer = setTimeout(
                    function() {
                        rematchPool(true);
                    },
                    2000
                );
            }
        }
    });
}

$(function () {
    $("#enter-pool").click(function() {
        if (checkPoolRunning) {
            cancelCheckPool = true;
            $(this).html('Enter Pool');
        } else {
            $(this).html('Enter Pool<br /><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>');
            checkPoolGameSpeed = gameSpeed;
            checkPool();
        }
    });
    $("#rematch").click(function() {
        if (rematchPoolRunning) {
            cancelRematchPool = true;
            $(this).html('Rematch');
        } else {
            $(this).html('Requesting Rematch...<br /><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>');
            rematchPool();
        }
    });
});

var width  = 320;
var height = 320;

var boardContent = $("#boardContainer");
var game_chatContent = $('#game-chat-log');
var input = $('#game-chat-input');

var maxPieceId = 1;

width = boardContent.width();
height = $("#boardContainer").width();

$(window).resize(function(){
    width = boardContent.width();
    height = $("#boardContainer").width();
});

var blackLastSeen = null;
var whiteLastSeen = null;

var myPing = null;
var blackPing = null;
var whitePing = null;

var boardLayer = new Konva.Layer();
var pieceLayer = new Konva.Layer();
var delayLayer = new Konva.Layer();

var pieces = {};
var piecesByImageId = {};
var piecesByBoardPos = {};
var suspendedPieces = {};
ranks.forEach(function (rank, index) {
    ranks.forEach(function (file, index) {
        piecesByBoardPos["" + rank + file] = null;
        suspendedPieces["" + rank + file] = null;
    });
});

// hardcoded translation of BB squares to board squares 4way
var bitboardToSquare4way = {
   '11150372599265311570767859136324180752990208' : 'a12',
   '5575186299632655785383929568162090376495104' : 'b12',
   '2787593149816327892691964784081045188247552' : 'c12',
   '1393796574908163946345982392040522594123776' : 'd12',
   '696898287454081973172991196020261297061888' : 'e12',
   '348449143727040986586495598010130648530944' : 'f12',
   '174224571863520493293247799005065324265472' : 'g12',
   '87112285931760246646623899502532662132736' : 'h12',
   '43556142965880123323311949751266331066368' : 'i12',
   '21778071482940061661655974875633165533184' : 'j12',
   '10889035741470030830827987437816582766592' : 'k12',
   '5444517870735015415413993718908291383296' : 'l12',
   '2722258935367507707706996859454145691648' : 'a11',
   '1361129467683753853853498429727072845824' : 'b11',
   '680564733841876926926749214863536422912' : 'c11',
   '340282366920938463463374607431768211456' : 'd11',
   '170141183460469231731687303715884105728' : 'e11',
   '85070591730234615865843651857942052864' : 'f11',
   '42535295865117307932921825928971026432' : 'g11',
   '21267647932558653966460912964485513216' : 'h11',
   '10633823966279326983230456482242756608' : 'i11',
   '5316911983139663491615228241121378304' : 'j11',
   '2658455991569831745807614120560689152' : 'k11',
   '1329227995784915872903807060280344576' : 'l11',
   '664613997892457936451903530140172288' : 'a10',
   '332306998946228968225951765070086144' : 'b10',
   '166153499473114484112975882535043072' : 'c10',
   '83076749736557242056487941267521536' : 'd10',
   '41538374868278621028243970633760768' : 'e10',
   '20769187434139310514121985316880384' : 'f10',
   '10384593717069655257060992658440192' : 'g10',
   '5192296858534827628530496329220096' : 'h10',
   '2596148429267413814265248164610048' : 'i10',
   '1298074214633706907132624082305024' : 'j10',
   '649037107316853453566312041152512' : 'k10',
   '324518553658426726783156020576256' : 'l10',
   '162259276829213363391578010288128' : 'a9',
   '81129638414606681695789005144064' : 'b9',
   '40564819207303340847894502572032' : 'c9',
   '20282409603651670423947251286016' : 'd9',
   '10141204801825835211973625643008' : 'e9',
   '5070602400912917605986812821504' : 'f9',
   '2535301200456458802993406410752' : 'g9',
   '1267650600228229401496703205376' : 'h9',
   '633825300114114700748351602688' : 'i9',
   '316912650057057350374175801344' : 'j9',
   '158456325028528675187087900672' : 'k9',
   '79228162514264337593543950336' : 'l9',
   '39614081257132168796771975168' : 'a8',
   '19807040628566084398385987584' : 'b8',
   '9903520314283042199192993792' : 'c8',
   '4951760157141521099596496896' : 'd8',
   '2475880078570760549798248448' : 'e8',
   '1237940039285380274899124224' : 'f8',
   '618970019642690137449562112' : 'g8',
   '309485009821345068724781056' : 'h8',
   '154742504910672534362390528' : 'i8',
   '77371252455336267181195264' : 'j8',
   '38685626227668133590597632' : 'k8',
   '19342813113834066795298816' : 'l8',
   '9671406556917033397649408' : 'a7',
   '4835703278458516698824704' : 'b7',
   '2417851639229258349412352' : 'c7',
   '1208925819614629174706176' : 'd7',
   '604462909807314587353088' : 'e7',
   '302231454903657293676544' : 'f7',
   '151115727451828646838272' : 'g7',
   '75557863725914323419136' : 'h7',
   '37778931862957161709568' : 'i7',
   '18889465931478580854784' : 'j7',
   '9444732965739290427392' : 'k7',
   '4722366482869645213696' : 'l7',
   '2361183241434822606848' : 'a6',
   '1180591620717411303424' : 'b6',
   '590295810358705651712' : 'c6',
   '295147905179352825856' : 'd6',
   '147573952589676412928' : 'e6',
   '73786976294838206464' : 'f6',
   '36893488147419103232' : 'g6',
   '18446744073709551616' : 'h6',
   '9223372036854775808' : 'i6',
   '4611686018427387904' : 'j6',
   '2305843009213693952' : 'k6',
   '1152921504606846976' : 'l6',
   '576460752303423488' : 'a5',
   '288230376151711744' : 'b5',
   '144115188075855872' : 'c5',
   '72057594037927936' : 'd5',
   '36028797018963968' : 'e5',
   '18014398509481984' : 'f5',
   '9007199254740992' : 'g5',
   '4503599627370496' : 'h5',
   '2251799813685248' : 'i5',
   '1125899906842624' : 'j5',
   '562949953421312' : 'k5',
   '281474976710656' : 'l5',
   '140737488355328' : 'a4',
   '70368744177664' : 'b4',
   '35184372088832' : 'c4',
   '17592186044416' : 'd4',
   '8796093022208' : 'e4',
   '4398046511104' : 'f4',
   '2199023255552' : 'g4',
   '1099511627776' : 'h4',
   '549755813888' : 'i4',
   '274877906944' : 'j4',
   '137438953472' : 'k4',
   '68719476736' : 'l4',
   '34359738368' : 'a3',
   '17179869184' : 'b3',
   '8589934592' : 'c3',
   '4294967296' : 'd3',
   '2147483648' : 'e3',
   '1073741824' : 'f3',
   '536870912' : 'g3',
   '268435456' : 'h3',
   '134217728' : 'i3',
   '67108864' : 'j3',
   '33554432' : 'k3',
   '16777216' : 'l3',
   '8388608' : 'a2',
   '4194304' : 'b2',
   '2097152' : 'c2',
   '1048576' : 'd2',
   '524288' : 'e2',
   '262144' : 'f2',
   '131072' : 'g2',
   '65536' : 'h2',
   '32768' : 'i2',
   '16384' : 'j2',
   '8192' : 'k2',
   '4096' : 'l2',
   '2048' : 'a1',
   '1024' : 'b1',
   '512' : 'c1',
   '256' : 'd1',
   '128' : 'e1',
   '64' : 'f1',
   '32' : 'g1',
   '16' : 'h1',
   '8' : 'i1',
   '4' : 'j1',
   '2' : 'k1',
   '1' : 'l1'
}

// hardcoded translation of BB squares to board squares
var bitboardToSquare = {
    '72057594037927936' : 'a8',
    '144115188075855872' : 'b8',
    '288230376151711744' : 'c8',
    '576460752303423488' : 'd8',
    '1152921504606846976' : 'e8',
    '2305843009213693952' : 'f8',
    '4611686018427387904' : 'g8',
    '9223372036854775808' : 'h8',
    '281474976710656' : 'a7',
    '562949953421312' : 'b7',
    '1125899906842624' : 'c7',
    '2251799813685248' : 'd7',
    '4503599627370496' : 'e7',
    '9007199254740992' : 'f7',
    '18014398509481984' : 'g7',
    '36028797018963968' : 'h7',
    '1099511627776' : 'a6',
    '2199023255552' : 'b6',
    '4398046511104' : 'c6',
    '8796093022208' : 'd6',
    '17592186044416' : 'e6',
    '35184372088832' : 'f6',
    '70368744177664' : 'g6',
    '140737488355328' : 'h6',
    '4294967296' : 'a5',
    '8589934592' : 'b5',
    '17179869184' : 'c5',
    '34359738368' : 'd5',
    '68719476736' : 'e5',
    '137438953472' : 'f5',
    '274877906944' : 'g5',
    '549755813888' : 'h5',
    '16777216' : 'a4',
    '33554432' : 'b4',
    '67108864' : 'c4',
    '134217728' : 'd4',
    '268435456' : 'e4',
    '536870912' : 'f4',
    '1073741824' : 'g4',
    '2147483648' : 'h4',
    '65536' : 'a3',
    '131072' : 'b3',
    '262144' : 'c3',
    '524288' : 'd3',
    '1048576' : 'e3',
    '2097152' : 'f3',
    '4194304' : 'g3',
    '8388608' : 'h3',
    '256' : 'a2',
    '512' : 'b2',
    '1024' : 'c2',
    '2048' : 'd2',
    '4096' : 'e2',
    '8192' : 'f2',
    '16384' : 'g2',
    '32768' : 'h2',
    '1' : 'a1',
    '2' : 'b1',
    '4' : 'c1',
    '8' : 'd1',
    '16' : 'e1',
    '32' : 'f1',
    '64' : 'g1',
    '128' : 'h1',
};

var getSquareFromBB = function(bb) {
    if (gameType == '4way') {
        return bitboardToSquare4way[bb];
    }
    return bitboardToSquare[bb];
}

// TODO build dynamically based on boardSize (number of squares)
// this are flipped lol whatever
var xToFile = ranks.slice();
var yToRank = files.slice();
yToRank.reverse();

var rankToX = {};
var fileToY = {};

var rankLength = ranks.length;
var fileLength = files.length;

for (var i = 0; i < rankLength; i++) {
    rankToX[yToRank[i]] = i;
}
for (var i = 0; i < fileLength; i++) {
    fileToY[xToFile[i]] = i;
}

var globalIdCount = 1;
var replayMode = false;

console.log("connecting..." + authId);

var updateTimeStamps = function(){
    var d = new Date();
    var timestamp = d.getTime();
    if (blackLastSeen == null || timestamp - blackLastSeen > 3000 ) {
        $("#blackOnline").addClass('offline');
        $("#blackOnline").removeClass('online');
    } else {
        $("#blackOnline").addClass('online');
        if (blackPing) {
            $("#blackOnline").attr("title", blackPing + " ms");
        }
        $("#blackOnline").removeClass('offline');
    }

    if (whiteLastSeen == null || timestamp - whiteLastSeen > 3000) {
        $("#whiteOnline").addClass('offline');
        $("#whiteOnline").removeClass('online');
    } else {
        $("#whiteOnline").addClass('online');
        if (whitePing) {
            $("#whiteOnline").attr("title", whitePing + " ms");
        }
        $("#whiteOnline").removeClass('offline');
    }
};

var joinGame = function(){
		var ret = {
			'c' : 'join',
            'gameId' : gameId
		};
        gameId = gameId;
        sendMsg(ret);
};

var resetGamePieces = function(){
    for(id in pieces){
		pieces[id].image.x(getX(pieces[id].image.x()));
		pieces[id].image.y(getY(pieces[id].image.y()));
    }
	pieceLayer.draw();
};

var bindGameEvents = function(ws_conn) {
    conn.onopen = function(evt) {
        // finished connecting.
        // maybe query for ready to join
        console.log("connected!");
        pingServer = setInterval(function() {
            var d = new Date();
            var timestamp = d.getTime();
            heartbeat_msg = {
                "c" : "ping",
                'timestamp' : timestamp,
                'ping' : myPing
            };
            sendMsg(heartbeat_msg);
        }, 3000); 
        joinGame();
        initialMessages.forEach(function (item, index) {
            handleMessage(item);
        });
    };

    conn.onerror = function(e) {
        console.log('Error!');
    };

    conn.onclose = function(e) {
        console.log('Disconnected!');
        game_reconnectInterval = setTimeout(
            game_reconnectMain,
            1000
        );
    };
};
var conn = new WebSocket(wsProtocol + "://" + wsDomain + "/ws");
bindGameEvents(conn);

var game_reconnectInterval;
var game_reconnectMain = function() {
    if (isConnected == false) {
        $("#connectionStatus").html("Reconnecting...");
        conn = null;
        conn = new WebSocket(wsProtocol + "://" + wsDomain + "/ws");
        bindGameEvents(main_conn);
    } else {
        reconnectInterval = null;
    }
}


sendMsg = function(msg) {
    if (msg.c != 'ping') {
        //console.log("sending msg:");
        //console.log(msg);
    }
    msg.gameId = gameId;
    msg.auth = authId;
    conn.send(JSON.stringify(msg));
};

readyToStart = function() {
    $("#readyToStart").attr("disabled","disabled");
    
    var msg = {
        "c" : "readyToBegin"
    };
    sendMsg(msg);
}

resign = function(){
    var msg = {
        "c" : "resign"
    };
    sendMsg(msg);
}

// TODO have the logic flip on confirmation not send
var drawRequested = false;
requestDraw = function() {
    if (drawRequested) {
        drawRequested = false;
        var msg = {
            "c" : "revokeDraw"
        };
        $('#requestDraw').html('Request Draw');
        sendMsg(msg);
    } else {
        drawRequested = true;
        var msg = {
            "c" : "requestDraw"
        };
        $('#requestDraw').html('Revoke Draw');
        sendMsg(msg);
    }
}

requestRematch = function() {
    var msg = {
        "c" : "requestRematch"
    };
    sendMsg(msg);
}

var getPieceSquare = function(piece) {
    var rank = yToRank[piece.y];
    var file = xToFile[piece.x];
    return file + rank;
}

var handleMessage = function(msg) {
    if (msg.c == 'move'){  // called when a piece changes positions (many times in one "move")
        var from = getSquareFromBB(msg.fr_bb);
        var to   = getSquareFromBB(msg.to_bb);

        pieceFrom = piecesByBoardPos[from];
        piecesByBoardPos[to]   = pieceFrom;
        piecesByBoardPos[from] = null;
    } else if (msg.c == 'stop'){ // when pieces collides and one is forced to stop
        let re = /([a-z])([0-9]{1,2})/;
        var from = getSquareFromBB(msg.fr_bb);

        var m_from = from.match(re);

        var y = rankToX[m_from[2]];
        var x = parseInt(fileToY[m_from[1]]);
        var pieceFrom = piecesByBoardPos[from];

        if (msg.hasOwnProperty('time_remaining')) {
            pieceFrom.stop(x, y, msg.time_remaining);
        } else {
            pieceFrom.stop(x, y);
        }

    } else if (msg.c == 'moveAnimate'){ // called when a player moves a piece
        let re = /([a-z])([0-9]{1,2})/;

        var from = getSquareFromBB(msg.fr_bb);
        var to   = getSquareFromBB(msg.to_bb);
        var m_from = from.match(re);
        var m_to   = to.match(re);

        if (msg.moveType == 3) {        // OO
            var pieceFrom = piecesByBoardPos[from];
            var pieceTo   = piecesByBoardPos[to];
            var y_king = rankToX[m_to[2]];
            var x_king = parseInt(fileToY[m_to[1]]) - 1;
            pieceFrom.move(x_king, y_king);

            var y_rook = rankToX[m_from[2]];
            var x_rook = parseInt(fileToY[m_from[1]]) + 1;
            pieceTo.move(x_rook, y_rook);
        } else if (msg.moveType == 4) { // OOO
            var pieceFrom = piecesByBoardPos[from];
            var pieceTo   = piecesByBoardPos[to];
            var y_king = rankToX[m_to[2]];
            var x_king = parseInt(fileToY[m_to[1]]) + 1;
            pieceFrom.move(x_king, y_king);

            var y_rook = rankToX[m_from[2]];
            var x_rook = parseInt(fileToY[m_from[1]]) - 2;
            pieceTo.move(x_rook, y_rook);
        } else { // all others
            var pieceFrom = piecesByBoardPos[from];
            var y = rankToX[m_to[2]];
            var x = fileToY[m_to[1]];
            pieceFrom.move(x, y);
        }
    } else if (msg.c == 'promote'){
        var square = getSquareFromBB(msg.bb);
        var piece = piecesByBoardPos[square];

		pieces[piece.id].image.destroy();
		var newQueen = getQueen(piece.x, piece.y, piece.color);
		newQueen.id = piece.id;
		pieceLayer.add(newQueen.image);
		pieces[newQueen.id] = newQueen;
        newQueen.setImagePos(newQueen.x, newQueen.y);
        if (piece.color == myColor || myColor == 'both'){
            newQueen.image.draggable(true);
        }
        piecesByBoardPos[square] = newQueen;
		pieceLayer.draw();
    } else if (msg.c == 'notready'){
        // happens when we join too quickly 
        var retry = setTimeout(function() {
            joinGame();
        }, 500); 
    } else if (msg.c == 'joined'){
        console.debug(msg);
		// TODO mark all color pieces as draggabble
		for(id in pieces){
			if (pieces[id].color == myColor || myColor == 'both'){
				pieces[id].image.draggable(true);
			}
		}
        console.debug(msg);
		resetGamePieces();
		pieceLayer.draw();
    } else if (msg.c == 'suspend'){
        // knights and castles are removed from the board entirely 
        // when they move, until they land.
        var from = getSquareFromBB(msg.fr_bb);
        var to   = getSquareFromBB(msg.to_bb);
        var piece = piecesByBoardPos[from];
        suspendedPieces[to] = piece;

        piecesByBoardPos[from] = null;
    } else if (msg.c == 'unsuspend'){
        // this is for knights and castles where the piece
        // is removed from the board then put down at the destination
        var square = getSquareFromBB(msg.to_bb);
        var piece = suspendedPieces[square];

        if (piece == null) {
            spawn(msg.chr, square);
            piece = suspendedPieces[square];
            piece.stop(x, y);
            // TODO add the delay animation here
        } else {
            piecesByBoardPos[square] = piece;
            suspendedPieces[square] = null;
        }
    } else if (msg.c == 'spawn'){
        spawn(msg.chr, msg.square);
    } else if (msg.c == 'pong'){
        var d = new Date();
        var timestamp = d.getTime();
        if (msg.color == 'black') {
            blackPing = msg.ping;
            blackLastSeen = timestamp;
            updateTimeStamps();
            // i sent this message so the ping timestamp is mine
            if (myColor == 'black') {
                myPing = timestamp - msg.timestamp;
            }
        } else if (msg.color = 'white') {
            whitePing = msg.ping;
            whiteLastSeen = timestamp;
            updateTimeStamps();
            // i sent this message so the ping timestamp is mine
            if (myColor == 'white') {
                myPing = timestamp - msg.timestamp;
            }
        }
    } else if (msg.c == 'kill'){
        var square = getSquareFromBB(msg.bb);
        var piece  = piecesByBoardPos[square];

        if (piece != null) {
            piece.image.destroy();
            if (piece.delayRect){
                piece.delayRect.destroy();
            }
            delete pieces[piece.id];
            piecesByBoardPos[square] = null;

            pieceLayer.draw();
        }
    } else if (msg.c == 'gameBegins'){
		for(id in pieces){
            pieces[id].setDelayTimer(3);
		}
        setTimeout(startGame, 3000)
    } else if (msg.c == 'chat') {
        input.removeAttr('disabled'); // let the user write another message
        var dt = new Date();
        addGameMessage(
            msg.author,
            msg.message,
            msg.color,
            'black',
            dt
        );
    } else if (msg.c == 'playerlost') {
        var dt = new Date();
        endGame();
        addGameMessage(
            "SYSTEM",
            msg.color + " has lost.",
            "red",
            'black',
            dt
        );
    } else if (msg.c == 'requestDraw') {
        if (msg.color == myColor) {

        }
        addGameMessage(
            "SYSTEM",
            msg.color + " as requested a draw.",
            "red",
            'black',
            dt
        );
    } else if (msg.c == 'gameDrawn') {
        var dt = new Date();
        endGame();
        addGameMessage(
            "SYSTEM",
            "The game has drawn.",
            "red",
            'black',
            dt
        );
    } else if (msg.c == 'resign') {
        var dt = new Date();
        endGame();
        addGameMessage(
            "SYSTEM",
            msg.color + " has resigned.",
            "red",
            'black',
            dt
        );
    } else if (msg.c == 'abort') {
        var dt = new Date();
        endGame();
        addGameMessage(
            "SYSTEM",
            "game has been aborted.",
            "red",
            'black',
            dt
        );
    } else {
        console.log("unknown msg recieved");
        console.debug(msg);
    }

}

var spawn = function(chr, square) {
        var piece;
        let re = /([a-z])([0-9]{1,2})/;
        var m = square.match(re);
        var f = m[1];
        var r = m[2];

        var piece  = piecesByBoardPos[square];

        if (piece == null) {
            var type = chr;

            var color = 'white';
            if (type > 200) {
                color = 'black';
            }
            if (type > 300) {
                color = 'red';
            }
            if (type > 400) {
                color = 'green';
            }

            var y = rankToX[r];
            var x = fileToY[f];

            if (type % 100 == 6){
                piece = getQueen(x, y, color);
            } else if (type % 100 == 5){
                piece = getKing(x, y, color);
            } else if (type % 100 == 4){
                piece = getRook(x, y, color);
            } else if (type % 100 == 3){
                piece = getBishop(x, y, color);
            } else if (type % 100 == 2){
                piece = getKnight(x, y, color);
            } else if (type % 100 == 1){
                piece = getPawn(x, y, color);
            } 
            piece.id = maxPieceId++;
            pieceLayer.add(piece.image);
            pieces[piece.id] = piece;
            if (piece.color == myColor || myColor == 'both'){
                pieces[piece.id].image.draggable(true);
            }
            var square = getPieceSquare(piece);
            piecesByBoardPos[square] = piece;

            pieceLayer.draw();
        }
}

var clearBoard = function() {
    for(id in pieces){
		pieces[id].image.destroy();
    }
    pieces = [];
    piecesByBoardPos = {};
    pieceLayer.draw();
}

conn.onmessage = function(evt) {

	var msg = JSON.parse(evt.data);
    if (msg.c != 'pong') {
        console.log("msg recieved: " + evt.data);
    }
    handleMessage(msg);
};

var startGame = function(){
    if (! replayMode) {
        $('#gameStatusWaitingToStart').hide();
        $('#gameStatusActive').show();
        $('#gameStatusWaitingToEnded').hide();
    }
}

var endGame = function(){
    if (! replayMode) {
        $('#gameStatusWaitingToStart').hide();
        $('#gameStatusActive').hide();
        $('#gameStatusEnded').show();

        for(id in pieces){
            if (pieces[id].color == myColor || myColor == 'both'){
                pieces[id].image.draggable(false);
            }
        }
    }
}

var getBoardPos = function(pos){
    var bPos = {};
    bPos.x = Math.floor(getX(pos.x) / width * boardSize);
    bPos.y = Math.floor(getY(pos.y) / height * boardSize);
	if (myColor == 'black'){
		bPos.y++;
	}
    return bPos;
};

var getPixelPos = function(pos){
    var bPos = {};
    bPos.x = Math.floor(getX(pos.x) * width / boardSize);
    bPos.y = Math.floor(getY(pos.y) * height / boardSize);
    return bPos;
};

var getX = function(x){
	if (myColor == 'green'){
		return height - y - (height / boardSize);
	}
	if (myColor == 'red'){
        return y;
	}
	return x;
};

var getY = function(y){
	if (myColor == 'black'){
		return height - y - (height / boardSize);
	}
	if (myColor == 'red'){
        return x;
	}
	if (myColor == 'green'){
        return width - x - (width / boardSize);
	}
	return y;
};

var getPieceImage = function(x, y, image){
    var pieceImage = new Konva.Image({
        image: image,
        x: x * width / boardSize,
        y: getY(y * height / boardSize),
        width: width / boardSize,
        height: height / boardSize,
        draggable: false
    });
    return pieceImage;
};

var getPawn = function(x, y, color){
    var pawnImage;
    if (color == "white"){
        pawnImage = whitePawn;
    } else if (color == 'red') {
        pawnImage = redPawn;
    } else if (color == 'green') {
        pawnImage = greenPawn;
    } else {
        pawnImage = blackPawn;
    }
    var piece = getPiece(x, y, color, pawnImage);

    piece.legalMove = function(x, y){
        var yDir = 1;
        if (this.color == 'black'){
            yDir = -1;
        }
        // let the server decide of moving diagnoally is okay
        if (this.firstMove){
            return ((y == yDir || y == yDir * 2) && x <= Math.abs(1));
        }
        return (y == yDir && x <= Math.abs(1));
    }
    return piece;
}

var getQueen = function(x, y, color){
    var queenImage;
    if (color == "white"){
        queenImage = whiteQueen;
    } else if (color == 'red') {
        queenImage = redQueen;
    } else if (color == 'green') {
        queenImage = greenQueen;
    } else {
        queenImage = blackQueen;
    }
    var piece = getPiece(x, y, color, queenImage);

    piece.legalMove = function(x, y){
        if (x == 0){ return true; }
        else if (y == 0){ return true; }
        else if (Math.abs(x) == Math.abs(y)){ return true; }
        return false;
    }
    return piece;
}

var getKing = function(x, y, color){
    var kingImage;
    if (color == "white"){
        kingImage = whiteKing;
    } else if (color == 'red') {
        kingImage = redKing;
    } else if (color == 'green') {
        kingImage = greenKing;
    } else {
        kingImage = blackKing;
    }
    var piece = getPiece(x, y, color, kingImage);

    piece.legalMove = function(x, y){
        if (x == 0){ return true; }
        else if (y == 0){ return true; }
        else if (Math.abs(x) == Math.abs(y)){ return true; }
        return false;
    }
    return piece;
}

var getRook = function(x, y, color){
    var rookImage;
    if (color == "white"){
        rookImage = whiteRook;
    } else if (color == 'red') {
        rookImage = redRook;
    } else if (color == 'green') {
        rookImage = greenRook;
    } else {
        rookImage = blackRook;
    }
    var piece = getPiece(x, y, color, rookImage);

    piece.legalMove = function(x, y){
        if (x == 0){ return true; }
        else if (y == 0){ return true; }
        return false;
    }
    return piece;
}

var getBishop = function(x, y, color){
    var bishopImage;
    if (color == "white"){
        bishopImage = whiteBishop;
    } else if (color == 'red') {
        bishopImage = redBishop;
    } else if (color == 'green') {
        bishopImage = greenBishop;
    } else {
        bishopImage = blackBishop;
    }
    var piece = getPiece(x, y, color, bishopImage);

    piece.legalMove = function(x, y){
        if (Math.abs(x) == Math.abs(y)){ return true; }
        return false;
    }
    return piece;
}

var getKnight = function(x, y, color){
    var knightImage;
    if (color == "white"){
        knightImage = whiteKnight;
    } else if (color == 'red') {
        knightImage = redKnight;
    } else if (color == 'green') {
        knightImage = greenKnight;
    } else {
        knightImage = blackKnight;
    }
    var piece = getPiece(x, y, color, knightImage);

    piece.legalMove = function(x, y){
        if (Math.abs(x) == 2 && Math.abs(y) == 1){ return true; }
        else if (Math.abs(y) == 2 && Math.abs(x) == 1){ return true; }
        return false;
    }
    return piece;
}


// piece that is inheritted from
var getPiece = function(x, y, color, image){
    var piece = {};
    piece.x = x;
    piece.y = y;
    piece.color = color;
    piece.image = getPieceImage(x, y, image);
    piece.isMoving  = false;
    piece.firstMove = true;

    piece.image_id = piece.image._id;
    piecesByImageId[piece.image_id] = piece;

    piece.move = function(x, y){
        //isLegal = this.legalMove(this.x - x, this.y - y);
        //if (!isLegal){
            //return false;
        //}
        isLegal = true;
        this.start_x = this.x;
        this.start_y = this.y;
        if (isLegal){
            this.x = x;
            this.y = y;
        }
        //piece.setImagePos();
        if (this.x != this.start_x || this.y != this.start_y){
            this.image.draggable(false);
            this.isMoving = true;
            piece.firstMove = false;
            //piece.anim_length = Math.sqrt( Math.pow(Math.abs(this.start_x - this.x), 2) + Math.pow(Math.abs(this.start_y - this.y), 2)) * timer * 100;
            // diagonal pieces move just as fast forward as straight pieces
            var x_dist = Math.abs(this.start_x - this.x);
            var y_dist = Math.abs(this.start_y - this.y);
            var longer_dist = (x_dist > y_dist ? x_dist : y_dist);
            piece.anim_length =  (longer_dist * timerSpeed / 10) * 1000;
            piece.anim = new Konva.Animation(function(frame) {
                var new_x = (piece.start_x * width / boardSize) + ((piece.x - piece.start_x) * (frame.time / piece.anim_length) * width / boardSize);
                var new_y = (piece.start_y * width / boardSize) + ((piece.y - piece.start_y) * (frame.time / piece.anim_length) * width / boardSize);
                piece.image.setX(getX(new_x));
                piece.image.setY(getY(new_y));

                if ((frame.time > piece.anim_length)){
                    this.stop();
                    piece.image.draggable(true);
                    piece.isMoving = false;

                    if (pieces[piece.id] != null) {
                        piece.setDelayTimer(timerRecharge)
                    }

                    piece.setImagePos(piece.x, piece.y);
                }
            }, pieceLayer);
            piece.anim.start();
        }
    }

    piece.stop = function(new_x, new_y, timeToCharge = timerRecharge) {
        piece.x = new_x;
        piece.y = new_y;
        if (piece.hasOwnProperty('anim')) {
            piece.anim.stop();
        }
        piece.image.draggable(true);
        piece.isMoving = false;
        piece.setDelayTimer(timeToCharge)
        piece.setImagePos(piece.x, piece.y);
    }

    piece.setDelayTimer = function(timeToDelay) {
        var rect = new Konva.Rect({
            x: getX(piece.x * width / boardSize),
            y: getY(piece.y * width / boardSize),
            width: width / boardSize,
            //height: (height / boardSize) * (timeToDelay / timerRecharge),
            height: height / boardSize,
            fill: '#888822',
            opacity: 0.5
        });
        delayLayer.add(rect);

        var tween = new Konva.Tween({
            node: rect,
            // TIMER
            duration: timeToDelay,
            height: 0,
            y: (getY(piece.y * width / boardSize) + (width / boardSize)),
        });
        piece.delayRect = rect;
        tween.play();
        delayLayer.draw();
    }

    piece.legalMove = function(x, y){
        return true;
    }

    piece.setImagePos = function(x, y){
        piece.image.setX(getX(this.x * width / boardSize));
        piece.image.setY(getY(this.y * width / boardSize));
        pieceLayer.draw();
    }
    return piece;
}

var isOccupied = function(x, y){
    for(id in pieces){
        if (pieces[id].x == x && pieces[id].y == y && pieces[id.isMoving == false]){
            return id;
        }
    }
    return false;
}

// *********************** setup the board
var setupBoard = function(){
    var stage = new Konva.Stage({
        container: 'container',
        width: width + 20,
        height: height + 20
    });

    for(var i = 0; i < boardSize; i++){
        for(var j = 0; j < boardSize; j++){
            var rect = new Konva.Rect({
              x: i * (width / boardSize),
              y: j * (width / boardSize),
              width: width / boardSize,
              height: height / boardSize,
              fill: (( (j + (i % 2) ) % 2) != 0 ? '#EEEEEE' : '#c1978e'),
            });
            boardLayer.add(rect);
        }
    }  

    for(var i = 0; i < boardSize; i++){
        var rank = new Konva.Text({
            x: i * (width / boardSize) + (width / (boardSize * 2)),
            y: height + 6,
            text: String.fromCharCode(97 + i),
            fontSize: 14,
            fontFamily: 'Calibri',
            fill: 'black'
        });
        var file = new Konva.Text({
            x: height + 6,
            y: i * (width / boardSize) + (boardSize * 2),
            text: boardSize - i,
            fontSize: 14,
            fontFamily: 'Calibri',
            fill: 'black'
        });
        boardLayer.add(rank);
        boardLayer.add(file);
    }

    stage.add(boardLayer);

    pieceLayer.draw();
    stage.add(pieceLayer);
    stage.add(delayLayer);

    return stage;
} 

var stage = setupBoard();

var tempLayer = new Konva.Layer();
stage.add(tempLayer);
var text = new Konva.Text({
    fill : 'black'
});
stage.on("dragstart", function(e){
    //e.target.moveTo(tempLayer);
    var pos = stage.getPointerPosition();
	e.target.offsetX(e.target.x() - pos.x + (width  / boardSize / 2));
	e.target.offsetY(e.target.y() - pos.y + (height / boardSize / 2));
    pieceLayer.draw();
});

var previousShape;
//stage.on("dragmove", function(evt){
//    var pos = stage.getPointerPosition();
//});
stage.on("dragend", function(e){
    var pos = stage.getPointerPosition();

	e.target.offsetX(0);
	e.target.offsetY(0);

    piece = piecesByImageId[e.target._id];

    piece.setImagePos(piece.x, piece.y);
    boardPos = getBoardPos(pos);

	var msg = {
		'c'  : 'move',
		'id' : piece.id,
		'x'  : boardPos.x,
		'y'  : boardPos.y,
        'move' : xToFile[piece.x] + yToRank[piece.y] + xToFile[boardPos.x] + yToRank[boardPos.y]
	}
    sendMsg(msg);

    pieceLayer.draw();
});
stage.on("dragenter", function(e){
    pieceLayer.draw();
});

stage.on("dragleave", function(e){
    e.target.fill('blue');
    pieceLayer.draw();
});

stage.on("dragover", function(e){
    pieceLayer.draw();
});

stage.on("drop", function(e){
    var pos = stage.getPointerPosition();
    //e.target.fill('red');

    //var anim = new Konva.Animation(function(frame) {
        //var piece = e.target;
        //piece.setX(amplitude * Math.sin(frame.time * 2 * Math.PI / period) + centerX);
    //}, pieceLayer);
    pieceLayer.draw();
});

// ------------- CHAT


/**
 * Send mesage when user presses Enter key
 */
input.keydown(function(e) {
    if (e.keyCode === 13) {
        var message = $(this).val();
        if (! message ){
            return;
        }

        var msg = {
            'c' : 'chat',
            'message' : message,
        };
        // send the message as an ordinary text
        sendMsg(msg);
        $(this).val('');
        // disable the input field to make the user wait until server
        // sends back response
        input.attr('disabled', 'disabled');
    }
});

/**
 * Add message to the chat window
 */
function addGameMessage(author, message, color, textcolor, dt) {
    game_chatContent.append('<p><span style="color:' + color + '">' + author + '</span><span style="font-size: 12px;color:grey"> ' +
            + (dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':'
            + (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes())
            + '</span> ' + message + '</p>');
    game_chatContent.scrollTop = game_chatContent.scrollHeight;
}

//$(document).ready(function () {
$(function () {
    $("#abortGame").click(function() {
        var msg = {
            "c" : "abort"
        };
        sendMsg(msg);
    });
    $("#replayGame").click(function() {
        replayMode = true;
        clearBoard();

        // clears all active timeouts
        var id = window.setTimeout(function() {}, 0);
        while (id--) {
            window.clearTimeout(id); // will do nothing if no timeout with id is present
        }

        var startTime = 0;
        var gameStart = false;
        gameLog.forEach(function (logMsg) {
            if (logMsg.msg.c == 'gameBegins') {
                startTime = logMsg.time + 3;
                gameStart = true;
            } else {
                var msgTimeout = 0;
                if ((gameStart && logMsg.msg.c != 'spawn') || (logMsg.msg.c == 'spawn')) {
                    msgTimeout = (logMsg.time - startTime) * 1000;
                }
                setTimeout(
                    function() {
                        handleMessage(logMsg.msg);
                    },
                    msgTimeout
                );
            }
        });
    });
});
