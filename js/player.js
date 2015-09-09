
var PLAYER_MODE = {PLAY_DEMO: 0, PLAY_VK_PLAYLIST: 1, PLAY_SIMILAR_ARTISTS: 2, PLAY_SIMILAR_TRACKS: 3, PLAY_TOP_TRACKS: 4};

Player = {

	_mode: PLAYER_MODE.PLAY_VK_PLAYLIST,
	
	_audio: null,
	
	_audioContext: null,
	_audioAnalyser: null,
	_sourceNode: null,
	
	
	_equalizer: null,
	
	
	_repeat: false,
	
	
	
	_c_panel: null,
	_c_p_sel: null,
	_c_p_pld: null,
	_c_p_ldd: null,
	_c_p_lft: null,
	_c_play: null,
	_c_repeat: null,
	_c_hint: null,
	
	init: function() {
		
		extend(Player, {
				_c_p_sel:	ge('c-p-select'),
				_c_p_pld:	ge('c-p-played'),
				_c_p_ldd:	ge('c-p-loaded'),
				_c_p_lft:	ge('c-p-t-left'),
				_c_play:	ge('control-play'),
				_c_repeat:	ge('control-repeat'),
				_c_panel:	ge('controls'),
				_c_hint:	ge('controls-hint')
			}
		)
		
		
		Player._c_p_sel.addEventListener('click', Player._onProgressSelect, false);
		
		
		//Due to unknown thoughts about Same-Origin Policy, next stuff is only working in Chrome browser	
		//http://stackoverflow.com/questions/19708561/firefox-25-and-audiocontext-createjavascriptnote-not-a-function
		//UPD. Now all modern browsers have same issues. So I proxy audio through nginx.
		//if(navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
			
			//Init audio context if supported
			window.AudioContext = window.AudioContext || window.webkitAudioContext;
			if(window.AudioContext) {
				
				Player._audioContext	= new AudioContext();
				
				Player._audioAnalyser	= Player._audioContext.createAnalyser();
				Player._audioAnalyser.connect(Player._audioContext.destination);
				
				
				Player._equalizer		= new gEqualizer( Player._audioAnalyser ,  ge('equalizer') );
				
				if(Player._equalizer) {
					var _ce = ge('controls-hint');
					_ce.innerHTML = '<b>(E)</b> - Toggle graphic equalizer modes, ' + _ce.innerHTML;
					
					var currentEqPlugin	= Cookie.get('_eq_plugin');
					if(currentEqPlugin != null) {
						Player._equalizer.setPlugin(currentEqPlugin);
					}
					
					document.body.addEventListener( 'keyup', function(event) {
							
							//No need to change eq plugin if user types something in SearchBox, etc.
							if(event.target != document.body) {
								return false;
							}
							
							if(event.which == 69) {
								
								var d = new Date();
									d.setTime(d.getTime() + (365*24*60*60*1000)); //1 year
								var expires = "expires="+d.toGMTString();
			
								if(Player._equalizer.nextPlugin()) {
									Cookie.set('_eq_plugin', Player._equalizer.getCurrentPluginName(), expires);
								} else {
									Cookie.set('_eq_plugin', '', 'expires=Thu, 01 Jan 1970 00:00:01 GMT');
								}
								
							}
							
							return false;
					}, false );
				}
				
				
			}
			
		//}
		
	
	},
	
	reset: function() {
		if(Player._audio) {
			//Do we need to remove events listeners?
			Player._audio.pause();
			
			//Stop audio downloading
			Player._audio.src = '';
			Player._audio.load();
			
			Player._audio		= null;
			
			Playlist._nowPlaying = null;
			
			Player._c_p_ldd.style.width = '0%';
			Player._c_p_pld.style.width = '0%';
			Player._c_p_lft.innerHTML	= '';
		}
		
		document.title = 'Drigl Play';
		
	},
	
	hideControls: function() {
		Player._c_panel.style.display	= 'none';
		Player._c_hint.style.display	= 'none';
	},
	
	showControls: function() {
		Player._c_panel.style.display	= 'block';
		if(!Modernizr.touch) {
			Player._c_hint.style.display	= 'block';
		}
	},
	
	
	setTrack: function(track) {
	
		Player.reset();
		
		Playlist._nowPlaying = track;
		
		//Trigger event
		Utils.trigger('Player.onTrackSet', track);
		
		Player._audio = new Audio(track.audio.url);
		Player.playPause();
		
		Player._audio.addEventListener('abort', function(e) {
			console.log('Audio: Abort. The user agent stops fetching the media data before it is completely downloaded, but not due to an error.');
		}, false);
		
		
		Player._audio.addEventListener('timeupdate', Player._onPlayProgress, false);
		Player._audio.addEventListener('progress', Player._onLoadProgress, false);
		
		Player._audio.addEventListener('ended', Player._onAudioEnded, false);
		
		//Update page title
		document.title = track.artist + ' - ' + track.title;
		
		if(Player._audioContext) {
			
			Player._sourceNode = Player._audioContext.createMediaElementSource(Player._audio);
			Player._sourceNode.connect(Player._audioAnalyser);
			
		}
		
	},
	
	setMode: function(mode) {
		Player._mode = mode;
	},
	
	getMode: function() {
		return Player._mode;
	},
	
	toggleRepeat: function() {
		
		//TODO: classList test in all browsers that support CSS3 Transformations
		if(Player._repeat) {
			Player._c_repeat.classList.remove('active');
		} else {
			Player._c_repeat.classList.add('active');
		}
		
		Player._repeat = !Player._repeat;
		
		return false;
	},
	
	playPause: function() {
		
		if(!Player._audio) {
			return false;
		}
				
		if(!Player._audio.paused) {
			Player._audio.pause();
		}
		else {
			Player._audio.play();
		}
			
		//set right icons
		Player.resetIcons();
		
		return false;
	},
	
	prev: function() {

		var track = Playlist.prevTrack();
		if(track) {
			Player.setTrack(track);
		}
		
		return false;
			
	},
	
	next: function() {

		var track = Playlist.nextTrack();
		if(track) {
			Player.setTrack(track);
		}
		
		return false;
		
	},
	
	
	resetIcons: function() {
		
		if(!Player._audio) {
			return false;
		}
		
		if(Player._audio.paused) {
			geByClass('glyphicon', Player._c_play)[0].className = 'glyphicon glyphicon-play';
		} else {
			geByClass('glyphicon', Player._c_play)[0].className = 'glyphicon glyphicon-pause';
		}
		
		return false;
	},
	
	
	
	
	
	
	
	_onPlayProgress: function() {
		
		if(!Player._audio) {
			return false;
		}
		
		var curTime = Math.floor(Player._audio.currentTime * 1000) / 1000;
		var totalTime = Math.floor(Player._audio.duration * 1000) / 1000;

		var per = (curTime/totalTime*100);
   		per = Math.min(100, Math.max(0, per));
		
		Player._c_p_pld.style.width = per+'%';
		
		Player._c_p_lft.innerHTML	= '-' + Player._formatTime(Math.round(totalTime-curTime));

	},
  
  	_onAudioEnded: function() {
		
		if(!Player._repeat) {
			return Player.next();
		} else {
			Player._audio.play();
		}
		
		return false;
	},
	
	_onLoadProgress: function() {
		
		if(!Player._audio) {
			return false;
		}
		
		var totalTime = Math.floor(Player._audio.duration * 1000) / 1000, bufferedTime;
		try {
		  bufferedTime = (Math.floor(Player._audio.buffered.end(0) * 1000) / 1000) || 0;
		} catch (e) {}
		

		if (totalTime && Math.abs(totalTime - bufferedTime) < 0.1) {
		  bufferedTime = totalTime;
		}
		
		var per = Math.ceil(bufferedTime/totalTime*100);
   		per = Math.min(100, Math.max(0, per));
		
		Player._c_p_ldd.style.width = per+'%';
		
	},
	  
	_onProgressSelect: function(event) {
		
		if(!Player._audio) {
			return false;
		}

		var rect = Player._c_p_sel.getBoundingClientRect();

		var per = Math.ceil((event.pageX - rect.left)/Player._c_p_sel.offsetWidth*100);
   		per = Math.min(100, Math.max(0, per));
		
		var d = Player._audio.duration;
		if(isNaN(d)) {
			return false;
		}
		
		var totalTime = Math.floor(d * 1000) / 1000;
		Player._audio.currentTime = per*totalTime/100;
		
	},
	
	_formatTime: function(t) {
		var res, sec, min, hour;
		t = toint(Math.max(t, 0));
		sec = t % 60;
		res = (sec < 10) ? '0'+sec : sec;
		t = Math.floor(t / 60);
		min = t % 60;
		res = min+':'+res;
		t = Math.floor(t / 60);
		if (t > 0) {
		  if (min < 10) res = '0' + res;
		  res = t+':'+res;
		}
		return res;
  	}

}



Playlist = {
	
	items: [],
	resetTime: Date.now(),
	
	_itemsCount: 0,
	
	_nowPlaying: null,
	
	//Track info prototype
	_trackInfo: {	artist:'', title:'', listeners: 0,
						album:{artist:'', title:'', image:'/img/misc/no_photo.gif'},
							audio:{url:'', duration:0} 
				},
				
	
	addTracksFromVK: function(t) {
		
		var tIDs = [];
		
		if(isArray(t)) {
			var i; var track;
			for(i in t) {
				track = t[i];
				if(typeof(track) == 'object') {
					tIDs.push(Playlist.addTrack(track));
				}
			}
		} else {
			tIDs.push(Playlist.addTrack(t));
		}
		
		return tIDs;
	},
	
	addTrack: function(a) {
		
		//init track object
		var track		= clone(Playlist._trackInfo);
								
		track.p_offset	= Playlist._itemsCount++; //Playlist offset, get current value and increment, so ID starts from 0.
							
		track.artist	= a.artist;
		track.title		= a.title;
		track.artist	= a.artist;
		
		track.audio.url			= a.url;
		if(track.audio.url) {
			track.audio.url = '/proxy.html?p=' + track.audio.url;
		}

		track.audio.duration	= a.duration;
										
		Playlist.items.push(track);
		
		
		return track.p_offset;
										
	},
	
	prevTrack: function() {
		if(!Playlist.length() || !Playlist._nowPlaying)
			return false;
		
		var p_offset = Playlist._nowPlaying['p_offset'];
		
		if(p_offset && Playlist.items[ p_offset-1 ] != undefined) {
			return Playlist.items[ p_offset-1 ];
		}
		
		return false;
	},
	
	nextTrack: function() {
		if(!Playlist.length() || !Playlist._nowPlaying)
			return false;
			
		var p_offset = Playlist._nowPlaying['p_offset'];
		
		if(Playlist.items[ p_offset+1 ] != undefined) {
			return Playlist.items[ p_offset+1 ];
		}
		
		return false;
	},
	
	getAvailableOffsetsRange: function(offset, limit) {
		var c = Playlist.length();
		if(!c || !Playlist._nowPlaying || offset == undefined || limit == undefined)
			return false;
		
		var r = [];
		while(limit-- && offset < c) {
			r.push(offset);
			offset++;
		}
			
		return r;
	},
	
	
	length: function() {
		return	Playlist._itemsCount;
	},
	
	
	removeTrack: function(i) {
		Playlist.items.splice(i, 1);
		return --Playlist._itemsCount;
	},
	
	reset: function() {
		
		Playlist.items			= [];
		Playlist._itemsCount	= 0;
		
		Playlist.resetTime		= Date.now();
		
		Playlist._nowPlaying	= null;
		
		//Trigger event
		Utils.trigger('Playlist.onPlaylistReset');
		
	}

}