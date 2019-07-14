package ChessGame;
use strict;
use warnings;
use Time::HiRes;
use JSON::XS;
use Data::Dumper;

sub new {
	my $class = shift;

	my $self = {};
	bless( $self, $class );

	if ($self->_init(@_)){
		return $self;
	} else {
		return undef;
	}
}

sub _init {
	my $self = shift;
    my ($id, $auth) = @_;
	$self->{id} = $id;

    $self->{playersByAuth} = {};
    $self->{playersConn}   = {};
    $self->{readyToPlay}   = 0;
    $self->{auth}          = $auth;
    $self->{serverConn}    = 0;
    $self->{whitePlayer}   = undef;
    $self->{blackPlayer}   = undef;

    $self->{whiteReady}    = 0;
    $self->{blackReady}    = 0;
    $self->{whiteRematchReady}  = 0;
    $self->{blackRematchPlayer} = 0;
    $self->{whiteDrawReady}  = 0;
    $self->{blackDrawPlayer} = 0;

	return 1;
}

sub setServerConnection {
    my $self = shift;
    my $conn = shift;

    $self->{serverConn} = $conn;
}

sub addConnection {
    my $self = shift;
    my ($connId, $conn) = @_;

    print "$connId, $conn\n";
    $self->{playersConn}->{$connId} = $conn;
    print Dumper($self->{playersByConn});
}

sub removeConnection {
    my $self = shift;
    my $conn = shift;

    delete $self->{playersConn}->{$conn};
}

### returns positive number if all players are ready for how many seconds until game begins
sub playerRematchReady {
    my $self = shift;
    my $msg = shift;

    my $color = $self->authMove($msg);
    if ($color){
        if ($color eq 'white'){
            $self->{whiteRematchReady} = time();
        } elsif($color eq 'black'){
            $self->{blackRematchReady} = time();
        }
        if ($self->{whiteRematchReady} && $self->{blackRematchReady}) {
            return 1;
        }
    }
    return 0;
}

### returns positive number if all players are ready for how many seconds until game begins
sub playerReady {
    my $self = shift;
    my $msg = shift;

    my $color = $self->authMove($msg);
    if ($color){
        if ($color eq 'white'){
            $self->{whiteReady} = time();
        } elsif($color eq 'black'){
            $self->{blackReady} = time();
        }
        if ($self->{whiteReady} && $self->{blackReady}) {
            $self->{readyToPlay} = ($self->{whiteReady} > $self->{blackReady} ? $self->{whiteReady} : $self->{blackReady}) + 3;
            my $msg = {
                'c' => 'gameBegins',
                'seconds' => 3
            };
            $self->playerBroadcast($msg);
            return 3;
        }
    }
    return 0;
}

### returns positive number if all players pressed draw
sub playerDraw {
    my $self = shift;
    my $msg = shift;

    print "draw attempt\n";
    my $color = $self->authMove($msg);
    if ($color){
        if ($color eq 'white'){
            $self->{whiteDraw} = time();
        } elsif($color eq 'black'){
            $self->{blackDraw} = time();
        }
        if ($self->{whiteDraw} && $self->{blackDraw}) {
            return 1;
        }
    }
    return 0;
}

### returns positive number if all players pressed rematch
sub playerRematch {
    my $self = shift;
    my $msg = shift;

    my $color = $self->authMove($msg);
    if ($color){
        if ($color eq 'white'){
            $self->{whiteRematch} = time();
        } elsif($color eq 'black'){
            $self->{blackRematch} = time();
        }
        if ($self->{whiteRematch} && $self->{blackRematch}) {
            return 1;
        }
    }
    return 0;
}

sub gameBegan {
    my $self = shift;
    return ($self->{readyToPlay} != 0 && $self->{readyToPlay} < time());
}

# returns which color the player is authed to move
sub authMove {
    my $self = shift;
    my $msg = shift;

    return 0 if (! defined($msg->{auth}));
    return 0 if (! defined($self->{playersByAuth}->{$msg->{auth}}));
    return $self->{playersByAuth}->{$msg->{auth}}->{color};
}

sub serverBroadcast {
    my $self = shift;
    my $msg = shift;
	#print "server broadcast for game: $self->{id}\n";
	$self->{serverConn}->send(encode_json $msg);
}

sub playerBroadcast {
    my $self = shift;
    my $msg = shift;

	#print "player broadcast game $self->{id}\n";
	delete $msg->{auth};

	foreach my $player (values %{ $self->{playersConn}}){
		#print "broadcasting to player $msg->{c}\n";
		$player->send(encode_json $msg);
	}
}

sub addPlayer {
    my $self = shift;
    my ($user, $color) = @_;

    $user->{color} = (defined($color) ? $color : 'none');

    if ($color eq 'white'){
        $self->{whitePlayer} = $user;
    } elsif ($color eq 'black'){
        $self->{blackPlayer} = $user;
    }

    $self->{playersByAuth}->{$user->{auth}} = $user;
    $self->playerBroadcast({
        'c' => 'playerjoined',
        'user' => {
            'color' => $user->{color},
            'screenname' => $user->{screenname},
            'rating' => $user->{rating},
            'id' => $user->{id}
        },
    });
}

1;