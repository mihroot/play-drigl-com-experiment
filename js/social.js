
Social = {
	
	_ItemsPerOnceLimit: 25,
	
	_logged: false,	

	
	_VKPermissions: 8206, //friends, photos, audio, wall
	_VKSession: null,
	_VKUser: null,
	
	_VKCaptchaNeeded: false,
	_VKCaptchaSid: '',
	_VKCaptchaKey: '',
	
	_VKRequestsQueue: [], //in case of captha
	//_VKRequestsDelay: 400, //3 request per 1 second
	
	
	_VKRequestsPerSecond: 3,
	_VKLastScheduledTime: 0,
	_VKRequestsScheduled: 0,
	_VKLastRequestTime: 0,
	

	
	//lastfm object
	lastfm: null,
	
	
	
	_soc_vk_btn: null,
	
	
	init: function() {
		
		
		extend(Social, {
				_soc_vk_btn: ge('vk-login')
			}
		)
		
		
		/* Create a cache object */
		var cache = new LastFMCache();
		
		/* Create a LastFM object */
		Social.lastfm = new LastFM({
		  apiKey    : '12ceaa11a67c256dade27f1ebfbea9db',
		  apiSecret : '155a15c8ec6132b58e83ea24c3671979',
		  cache     : cache
		});
		
		var a = function() {
			if(typeof(VK) != 'undefined') {
				VK.Auth.getLoginStatus(Social.VKCheckLoginStatus);
			} else {
				setTimeout(a, 100);
			}
		}; a();
	},
	
	getUserInfo: function() {
		return Social._VKUser;
	},
	
	getUserAudio: function() {
		
		Social.VKGetUserAudio();
		return false;
		
	},
	

	
	
	
	
	
	
	VKLogin: function() {
		
		hide(Social._soc_vk_btn);
		Scene.showLoader();
		
		VK.Auth.login( Social.VKCheckLoginStatus , Social._VKPermissions );
		
		return false;
	},
	
	VKLogout: function() {
		
		VK.Auth.logout( function(response) {
			if(!response.session) {
					
				show(Social._soc_vk_btn);
				
				Social._logged		= false;
				
				Social._VKSession	= null;
				Social._VKUser		= null;
								
				//Trigger event
				Utils.trigger('Social.onLogout');
				
			}
		});
		
		return false;
	},
	
	VKCheckLoginStatus: function(response) {
		
		if(Social._logged) {
			return false;
		}
		
		
		if(!response.session) {
			show(Social._soc_vk_btn);
			Scene.hideLoader();
			return false;
		}

		VK.Api.call('account.getAppPermissions', {}, function(gapResponse) {
			if(gapResponse.response >= Social._VKPermissions) {
				
				//hide loader
				Scene.hideLoader();
				
				Social._logged = true;
				
				Social._VKSession = response.session;
				
				//Trigger event
				Utils.trigger('Social.onLogin');

				Social.VKGetUserData();

			} else {
				
				Social.VKLogout();
				
			}
		});
	},
	
	VKGetUserData: function() {
		VK.Api.call('users.get', {
					uids: Social._VKSession.mid,
					fields:'uid,first_name,last_name,screen_name,nickname,domain,sex,photo_100,photo_50,contacts,city,email'
				}, function(response) {
					if(response.response && response.response[0]) {
						
						Social._VKUser = response.response[0];
						
						//Trigger event
						Utils.trigger('Social.onUserDataReceived');
					}
		});
	},
	
	VKGetUserAudio: function() {
		
		if(!Social._logged)
			return false;
			
		VK.Api.call('audio.get', {
					owner_id: Social._VKSession.mid,
					//count: Social._ItemsPerOnceLimit
				}, function(response) {
					if(response.response) {
						
						//Parse result
						var tIDs = Playlist.addTracksFromVK(response.response);
						
						console.log('VKGetUserAudio: ' + tIDs.length + ' tracks added to playlist');
						
						//Trigger an event			
						Utils.trigger('Social.onPlaylistItemsReceived', tIDs);
						
					}
				}
		);
		
	},
	
	
	
	VKSearchAudio: function(q, performer_only) {
					
		if(!Social._logged)
			return false;


		
		var query = {	q: q,
						performer_only: performer_only != undefined ? performer_only : 0,
						sort: 2 // 2 — popularity, 1 — duration, 0 - add date
				};

		
		Social._VKDoApiRequest('audio.search', query, function(response) {

					if(response) {
						
						//-1, VK return total audio files in first row
						var items_found = (response.length - 1);
						console.log('VKSearchAudio: ' + q + ' - ' + items_found + ' items found ');
						
						if(items_found) {
							
							//Calc random audio index
							var i = getRandomInt(1, items_found);
											
							var tIDs = Playlist.addTracksFromVK(response[i]);
							
							//Trigger event
							Utils.trigger('Social.onPlaylistItemsReceived', tIDs);
							
						}
					} 
				});
		
		
	},
	
	
	VKCapthaSubmit: function(sid, key) {
		
		Social._VKCaptchaSid = sid;
		Social._VKCaptchaKey = key;
		
		//TODO: verification
		if(sid && key) {
			var win = document.getElementsByClassName('win-captha').item(0).parentNode;
			if(win) {
				Window.close(win.id);
			}
		}
		
		//unblock captcha stopper
		Social._VKCaptchaNeeded = false;
		
		//copy current queue and reset
		var queue = clone(Social._VKRequestsQueue);
		Social._VKRequestsQueue = [];
		
		var i;
		for(i in queue) {
			
			/*if(queue[i][0] == 'audio.search') {
				( function ( args , timeout ) {
						setTimeout(function() {
							
							Social._VKDoApiRequest(args[0], args[1], args[2]);
							
						}, timeout);
					} ) (queue[i], Social._VKRequestsDelay * i);
			} else {
					
				Social._VKDoApiRequest(queue[i][0], queue[i][1], queue[i][2]);
				
			}*/
			
			Social._VKDoApiRequest(queue[i][0], queue[i][1], queue[i][2]);
			
		}
		
		
		return false;
	},
	
	
	_VKDoApiRequest:function(method, params, callback) {
		
			
		if(!Social._logged)
			return false;

		
		if(Social._VKCaptchaNeeded) {
			Social._VKRequestsQueue.push([method, params, callback]);
			return false;
		}
		

		if(params == undefined) {
			params = [];
		}
		
		if(Social._VKCaptchaKey && Social._VKCaptchaSid) {
			params['captcha_sid'] = Social._VKCaptchaSid;
			params['captcha_key'] = Social._VKCaptchaKey;
		}
		
		
		var second = 1100;
		var now = Date.now(); var timeout = 0; var dif;
		
		
		//reset
		if(Social._VKLastScheduledTime + second < now || Playlist.resetTime > Social._VKLastRequestTime) {
			Social._VKLastScheduledTime = now;
			Social._VKRequestsScheduled = 1;
		} else {
			
			Social._VKRequestsScheduled++;
			
			
			if(Social._VKRequestsScheduled > Social._VKRequestsPerSecond) {
				Social._VKLastScheduledTime = Social._VKLastScheduledTime + second
				Social._VKRequestsScheduled = 1;
			}
			
			timeout = Social._VKLastScheduledTime - now;
			if(timeout < 0) timeout = 0;
			
		}
		
		
		//console.log(method, timeout);
		
		Social._VKLastRequestTime = now;
		
		
		(function(time, timeout) {
			setTimeout(function() {
				
				//isn't to late? :)
				if(method == 'audio.search' && Playlist.resetTime > time) {
					return false;
				}
				
				VK.Api.call(method, params, function(response) {
						
						//isn't to late? :)
						if(method == 'audio.search' && Playlist.resetTime > time) {
							return false;
						}
				
						if(response.response) {
							
							callback.call(Social, response.response);
							
						} else if(response.error) {
	
							Social._VKHandleErrors(response.error, [method, params, callback]);
						
						}
						
				});
			}, timeout);
		})(now, timeout);
		
	
	},
	
	
	_VKHandleErrors: function(error, request) {
		
		switch(error.error_code) {
			
			//TOO many requests
			case 6:
				console.log(error);
				
				//retry
				Social._VKDoApiRequest(request[0], request[1], request[2]);
				
			break;
			
			//Captcha needed
			case 14:
			
				Social._VKCaptchaNeeded = true;
				Social._VKRequestsQueue.push(request);
				
				//open modal only if not exists
				if(!document.getElementById('captcha_sid')) {
					Window.create({header: 'Please enter the captcha code', body: '<div style="height:80px;line-height:80px;text-align:center; padding-top:15px"><img src="'+error.captcha_img+'"></div><form onSubmit="return Social.VKCapthaSubmit(document.getElementById(\'captcha_sid\').value, document.getElementById(\'captcha_key\').value);" style="text-align: center;"><input type="hidden" id="captcha_sid" value="'+error.captcha_sid+'"><input type="text" id="captcha_key"><p><button type="submit">Send</button></p></form>'}, 'win-captha');
				}
				
			break;
			default:
				console.log(error);
			break;
		}
		
		//console.log(Social._VKRequestsQueue);
	},
	
	
	
	
	
	
	
	
	
	
	
	
	LFMTrackGetInfo: function(id, artist, track, time) {

		/* Load some track info. */
		Social.lastfm.track.getInfo({artist: artist, track: track}, {success: function(data){
			
			//isn't to late? :)
			if(Playlist.resetTime > time) {
				return false;
			}
			
			var lfm_info = data.track;
			
			
			//Upgrade playlist item info if needed
			if(lfm_info['listeners'])
				Playlist.items[id]['listeners'] = lfm_info['listeners'];
			
			if(lfm_info['album']) {
				if(lfm_info['album']['image'])
					Playlist.items[id]['album']['image'] = lfm_info['album']['image'][3]['#text'];
			}
			

			if(lfm_info['artist'] && lfm_info['artist']['name'])
				Playlist.items[id]['artist'] = lfm_info['artist']['name'];
				
				
			//Trigger event
			Utils.trigger('Social.onTrackInfoUpdate', Playlist.items[id]);
			
			
		}, error: function(code, message){
		  /* Show error message. */
		}});
	},
	
	LFMArtistGetSimilar: function(q, cb) {
		
		
		/* Load some artist info. */
		Social.lastfm.artist.getSimilar({
										artist: q,
										autocorrect: 1,
										limit: Social._ItemsPerOnceLimit
									}, {
									
											success: function(data){

												var artists = [];
												if(data.similarartists && data.similarartists.artist && isArray(data.similarartists.artist)) {
													//console.log(data.similarartists['@attr'].artist);
													artists = data.similarartists.artist;
												}
												
												cb.call(Social, artists);
												
											}, error: function(code, message){
												
												console.log(code, message);
												
												//TODO
												//6 - "The artist you supplied could not be found"
												if(code == 6) {
													cb.call(Social, []);
												}

											}
									}
		);

		
		
										
										
		
		
		return false;
	},
	
	
	
	
	searchSimilar: function(q) {
		
		Social.LFMArtistGetSimilar(q, function(artists) {
			
			if(artists.length) {
				
				console.log('LFMArtistGetSimilar: ' + artists.length + ' artists found');
						
				var i;
				for(i in artists) {
					
													
					/*( function ( artist , timeout ) {
						setTimeout(function() {
							
							Social.VKSearchAudio(artist.name, 1);
							
						}, timeout);
					} ) (artists[i], Social._VKRequestsDelay * i);
					*/
					
					Social.VKSearchAudio(artists[i].name, 1);
					
				}
				
				
				//TODO: use VK execute
				/*var i; var vk_script = ''; var vk_queries = [];
				for(i in artists) {
					vk_queries.push('API.audio.search({"q":"'+artists[i].name+'", "count":30})');
				}
				vk_script = 'return ['+vk_queries.join(',')+'];';
				VK.Api.call('execute', {code:vk_script}, function(response) {
						console.log(response);
					}
				);*/
															
			} else {
				Scene.hideLoader();
			}
			
													
		});
		
		return false;
	}
}

