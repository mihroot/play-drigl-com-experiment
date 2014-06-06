var Element = function ( entry ) {

	var dom = document.createElement( 'a' );
	dom.style.position	= 'relative';
	dom.style.display	= 'block';
	dom.style.cursor	= 'pointer';
	dom.className		= 'entry';
	dom.id				= entry.p_offset+'-entry';
	
	
	
	var image = document.createElement( 'img' );
				image.className		= 'album-image';
				image.style.width	= '100%';
				image.style.height	= '100%';
				image.src = entry.album.image;
				image.style.display = image.src?'block':'none';
				dom.appendChild( image );
	

	var desc = document.createElement( 'div' );
	desc.className = 'desc';
	desc.innerHTML = entry.artist + ' - ' + entry.title;
	dom.appendChild( desc );
					
	var object = new THREE.CSS3DObject( dom );
	
	object.position.x = Math.random() * 2000 - 1000;
	object.position.y = Math.random() * 1000 - 0;
	
	if(Scene._lastVisibleObjectZ == null) {
		Scene._firstVisibleObjectZ = Scene._lastVisibleObjectZ = object.position.z = 0;
	} else {
		Scene._lastVisibleObjectZ = object.position.z = Scene._lastVisibleObjectZ - (Scene._distanceBetweenObjects);
	}
	
	
	dom.addEventListener( 'click', function ( event ) {
		
		event.stopPropagation();
		
		if(object != Scene._activeObect) {
			//console.log(object.position.z);
			Player.setTrack(entry);
		} else {
			//console.log(object.position.z);
			//Player.playPause();
		}
		
	}, false);
	
	
	return object;
				
}



Scene = {
	
	_auto: false,
	
	_window_focus: true,


	_cameraFar: 5000,
	_camera: null,
	
	_cameraXYTween: null,
	_movementTween: null,
	
	_cameraInitialY: -75,
	_distanceFromCameraToActiveObject:	500,
	_distanceBetweenObjects:			500 * 1.5, //_distanceFromCameraToActiveObject * 1.5
	
	_scene: null,
	_renderer: null,
	
	
	_movingFromObject:	null,
	_activeObect:		null,
	_activeDomObect:	null,
	
	_objectsLimit:	8,
	
	
	_availablePlaylistItems: [],
	_min_availableItemOffset: null,
	_max_availableItemOffset: null,
	
	
	_firstVisibleObjectZ: null,
	_lastVisibleObjectZ: null,
	
	
	
	_s_loader: null,
	
	
	init: function() {
		
		
		extend(Scene, {
				_s_loader: ge('loading-indicator')
			}
		)
		
		Scene._camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, Scene._cameraFar );
		Scene._camera.position.y = Scene._cameraInitialY;

		Scene._scene = new THREE.Scene();


		Scene._renderer = new THREE.CSS3DRenderer();
		Scene._renderer.setSize( window.innerWidth, window.innerHeight );
		Scene._renderer.domElement.style.position = 'absolute';
		Scene._renderer.domElement.style.top = 0;
		document.getElementById( 'container' ).appendChild( Scene._renderer.domElement );
		
				
		//Event listeners
		window.addEventListener( 'resize', Scene._onWindowResize, false );
		
		
		//Detect window focus in and out.. requestAnimationFrame will not work if window is not visible, coz rendering will not happen
		window.addEventListener( 'focus', function() {
			Scene._window_focus = true;
		}, false );
		window.addEventListener( 'blur', function() {
			Scene._window_focus = false;
		}, false );
		
		
		//document.body.addEventListener( 'mousewheel', Scene._onMouseWheel, false );
		//document.body.addEventListener( 'DOMMouseScroll', Scene._onMouseWheel, false ); //firefox
		document.body.addEventListener( 'mousemove', Scene._onMouseMove, false );
		
		document.addEventListener( 'keyup', function(event) {
			//No need to process keyup if user types something in SearchBox, etc.
			if(event.target != document.body) {
				return false;
			}
							
			if(event.which == 39) {
				return Player.next();
			} else if(event.which == 37) {
				return Player.prev();
			} else if(event.which == 32) {
				return Player.playPause();
			}
			return false;
		}, false );
		
		return this;		
	},
	
	
	hideLoader: function() {
		Scene._s_loader.style.display	= 'none';
	},
	
	showLoader: function() {
		Scene._s_loader.style.display	= 'block';
	},
	
	
	
	
	move: function( delta ) {
		
		var sch_l = Scene._scene.children.length;
		if(!sch_l)
			return false;
			
		//Min track playlist offset that visible in scene
		//var min_p_offset = Math.min.apply(null, Scene._availablePlaylistItems);
		//Maximum track playlist offset that visible in scene
		//var max_p_offset = Math.max.apply(null, Scene._availablePlaylistItems);
		
		
		_maxAllowedZ = - (Scene._objectsLimit * Scene._distanceBetweenObjects);
				
		
		//update last/first object Z position
		Scene._lastVisibleObjectZ	+= delta;
		Scene._firstVisibleObjectZ	+= delta;
		
		
		while( sch_l -- ) {
		
			var object = Scene._scene.children[ sch_l ];
			
			//update object Z position
			object.position.z += delta;

			
			var track_p_offset = parseInt(object.element.getAttribute('id'));

			
			//moving forward
			if(delta > 0) {
				
				//if object passed camera and we don't see it, remove object from scene
				if (object.position.z > 0 ) {
										
					//remove non-visible object
					Scene.removeTrackFromScene( object );
					console.log('Object behind camera removed from scene');
					
					
					var offsets = Playlist.getAvailableOffsetsRange(Scene._max_availableItemOffset+1, 1);
					if(offsets) {
						
						//append one more object
						Scene.addTracksToScene(offsets);
						
						console.log('Object added to scene');
					}
					
				}
			
			} else if(delta < 0) {//moving backward
				
				
				if(Scene._min_availableItemOffset && Scene._min_availableItemOffset == track_p_offset) {
										
					if(object.position.z < - Scene._distanceBetweenObjects) {
						
						if(!(Playlist.items[Scene._min_availableItemOffset-1]['threeObject'].parent instanceof THREE.Scene)) {
							
							//Return Object to Scene
							Scene.addTracksToScene(Scene._min_availableItemOffset-1, false);
							
							console.log('Object returned to scene');
														
						}
					}
					
				}
				
				
				//Check if object is too far
				if( object.position.z < _maxAllowedZ) {
					
					//
					if(Scene._movingFromObject === object) {
						Scene._movingFromObject = Playlist.items[Scene._max_availableItemOffset-1]['threeObject'];
					}
										
					
					//remove non-visible object
					Scene.removeTrackFromScene( object );
					
					console.log('Far object hided from scene');
				
				}
				
			
			}
			
		}	

	},
	
	
	
	
	/**
	 * Remove THREE Object from Scene
	 * @param {Object} THREE Object
	 * @return {void}
	 * @public
	 */
	removeTrackFromScene: function( object ) {
		
		var track_p_offset = parseInt(object.element.getAttribute('id'));
		
		
		for(var j in Scene._availablePlaylistItems) {
			if(Scene._availablePlaylistItems[j] == track_p_offset) {
				Scene._availablePlaylistItems.splice(j, 1);
				break;
			}
		}
											
		
		//remove
		Scene._scene.remove( object );
			
		
		
		if(Scene._max_availableItemOffset == track_p_offset) {
			
			//Update last object Z
			Scene._lastVisibleObjectZ += Scene._distanceBetweenObjects;
			
			//Maximum track playlist offset that visible in scene
			Scene._max_availableItemOffset = Math.max.apply(null, Scene._availablePlaylistItems);
		
		}
		
		
		if(Scene._min_availableItemOffset == track_p_offset) {
			
			//Update last object Z
			Scene._firstVisibleObjectZ -= Scene._distanceBetweenObjects;
			
			//Min track playlist offset that visible in scene
			Scene._min_availableItemOffset = Math.min.apply(null, Scene._availablePlaylistItems);
			
		}
		
	},
	
	
	/**
	 * Adds selected playlist tracks to scene if this is still posible (Scene._scene.children.length < Scene._objectsLimit)
	 * @param {Array} playlist tracks array offsets
	 * @return {void}
	 * @public
	 */
	addTracksToScene: function(ids, append) {
		
		if(append == undefined) {
			append = true;
		}
		
		var object; var track;
		
		if(!isArray(ids)) {
			ids = [ids];
		}
		
		for(var i in ids) {
			
			//Check if we reached visible objects per scene limit			
			if(append && Scene._scene.children.length >= Scene._objectsLimit) {
				break;
			}		
			
			track = Playlist.items[ids[i]];
			
			if(track['threeObject'] == undefined || !track['threeObject']) {
				
				object = new Element( track );
				
				//Get additional track info from Last.FM (album cover, artist info, etc.)
				Social.LFMTrackGetInfo(track.p_offset, track.artist, track.title, Date.now());
				
			} else {
				
				object = track['threeObject'];
				
				if(append) {
					Scene._lastVisibleObjectZ = object.position.z = Scene._lastVisibleObjectZ - Scene._distanceBetweenObjects;
				} else {
					Scene._firstVisibleObjectZ = object.position.z = Scene._firstVisibleObjectZ + Scene._distanceBetweenObjects;
				}
				
			}
			
			//Add THREE Object to Scene
			Scene._scene.add( object );
			
			
			//
			Scene._availablePlaylistItems.push(ids[i]);
					
			
			if(Scene._min_availableItemOffset == null || Scene._min_availableItemOffset > ids[i]) {
				Scene._min_availableItemOffset = ids[i];
			}
			
			if(Scene._max_availableItemOffset == null || Scene._max_availableItemOffset < ids[i]) {
				Scene._max_availableItemOffset = ids[i];
			}
			
			
			track['threeObject'] = object;
					
		}
		
		
		//Start playing first object
		if(Playlist.length() && !Scene._activeDomObect) {
			Player.setTrack(Playlist.items[0]);
		}

	},
	
	
	
	
	/**
	 * Moves to new active THREE CSS3DObject
	 * @param {Object} THREE CSS3DObject we are moving to
	 * @return {void}
	 * @public
	 */
	moveToObject: function(object) {

		//remove active class from active object
		if(Scene._activeDomObect) {
			Scene._activeDomObect.className = 'entry';
		}
		
		
		//If tween was started from object that is not visible now, reset Scene._movingFromObject
		if(Scene._movingFromObject && Scene._movingFromObject.position.z > 0) {
			Scene._movingFromObject = null;
		}	
		
		
		//If new object is behind camera, set Scene._movingFromObject only if it == null. In case if multiple clicks for previous track, we need valid Z coordinate, that calculated only for visible objects
		if((object.position.z > 0 && !Scene._movingFromObject) || object.position.z <= 0) {	
			Scene._movingFromObject = Scene._activeObect;
		}
		
		
		var obj_moving_to_offset	= parseInt(object.element.getAttribute('id'));
		var obj_moving_from_offset	= 0; var obj_moving_from_z = 0;
		
		if(Scene._movingFromObject) {
			
			//Get playlist offset of object we are moving from
			obj_moving_from_offset	= parseInt(Scene._movingFromObject.element.getAttribute('id'));
			
			//Get Z coordinate of object we are moving from
			obj_moving_from_z		= Scene._movingFromObject.position.z;
			
		}
		
		
		//Set new Active object
		Scene._activeObect				= object;
		Scene._activeDomObect			= object.element;
		Scene._activeDomObect.className	= 'entry active';
			

		
		
		//Z distance to run
		var prev = obj_moving_from_z + Scene._distanceFromCameraToActiveObject - (obj_moving_to_offset - obj_moving_from_offset) * Scene._distanceBetweenObjects;
		
		//Stop uncompleted tween
		if(Scene._movementTween) {
			Scene._movementTween.stop();
		}
		

		//Move scene objects
		//If we have focus on window and requestAnimationFrame is working, we move everything with animation. If not, we just change coordinates
		if(Scene._window_focus) {
			
			Scene._movementTween = new TWEEN.Tween( { value: prev } )
				.to( { value: 0  }, 2000 )
				.onUpdate( function () {
	
					Scene.move( this.value - prev );
					prev = this.value;
	
				} )
				.onComplete(function() {
					
					Scene._movementTween	= null;
					Scene._movingFromObject	= null;
			
				})
				.easing( TWEEN.Easing.Exponential.Out )
				.start();
				
			
			//Move camera by X and Y
			Scene._moveCameraXY(Scene._camera.position, { x: object.position.x, y: object.position.y + Scene._cameraInitialY }, 1500);
		
		} else {

			Scene.move( - prev );
			extend(	Scene._camera.position, { 
						x: object.position.x, 
						y: object.position.y + Scene._cameraInitialY 
			} );
			
			Scene._movementTween	= null;
			Scene._movingFromObject	= null;
		
		}
		
		
	},
	
	
	
	updateTrackInfo: function(data) {
		
		var dom = data['threeObject'].element;
		
		if(data.album.image) {
			var img = getChildByClassName('album-image', dom);
			img.src = data.album.image;
		}
		
	},
	
	
	
	playSimilar: function() {
		
		if(!Scene._activeDomObect) {
			return false;
		}
		
		var id = parseInt(Scene._activeDomObect.getAttribute('id'));
		
		return Scene.search(Playlist.items[ id ].artist);
		
	},
	
	
	showSearch: function() {
		
		var id = parseInt(Scene._activeDomObect.getAttribute('id'));

		/*Window.create({
				'body': '<div id="search">Play similar to <a onclick="return Scene.playSimilar();"><!--i class="glyphicon glyphicon-play"></i--> <b>'+ Playlist.items[ id ].artist +'</b> <!--(click to play)--></a> <form class="mT25px" onSubmit="return Scene.search();"><label for="query" class="mR10px">or enter artist name:</label><input id="query" type="text" value=""><button id="button" class="mL5px">play</button></form></div>'
			}, 'win-search');*/
			
		Window.create({
				'body': '<div id="search"><form class="mT25px" onSubmit="return Scene.search();"><label for="query" class="mR10px">Play similar to: </label><input id="query" type="text" value="" placeholder="'+ Playlist.items[ id ].artist.replace(/"/g, "&quot;") +'"><button id="button" class="mL5px">play</button></form></div>'
			}, 'win-search');
			
			
	},
	
	
	search: function(q) {
		
		var qElm = document.getElementById('query');
		
		if(q == undefined) {
			//if(qElm && !qElm.value)
			//	return false;
			if(!qElm) {
				return false;
			}
			q = (qElm && qElm.value)?qElm.value:qElm.getAttribute('placeholder'); //'';
		} else {
			//qElm.value = q;
		}

		if(qElm) {
			//close window
			var win = document.getElementsByClassName('win-search').item(0).parentNode;
			if(win) {
				Window.close(win.id);
			}
		}
		
		Scene.reset();
		
		//document.getElementById('search').style.display = 'none';
		
		
		Scene.showLoader();
		
		//Hide controls
		Player.hideControls();
		
		if(q) {
			Player.setMode(PLAYER_MODE.PLAY_SIMILAR_ARTISTS);
			return Social.searchSimilar(q);
		}
		else {
			Player.setMode(PLAYER_MODE.PLAY_VK_PLAYLIST);
			return Social.getUserAudio();
		}
		
	},
	
	
	
	_onWindowResize: function () {

		Scene._camera.aspect = window.innerWidth / window.innerHeight;
		Scene._camera.updateProjectionMatrix();

		Scene._renderer.setSize( window.innerWidth, window.innerHeight );

	},
	_onMouseWheel: function ( event ) {

		Scene.move( event.wheelDelta?event.wheelDelta:(-40*event.detail) );

	},
	_onMouseMove: function ( event ) {
		
		var mouse_x	= event.pageX;
		var mouse_y	= event.pageY;
		
		Scene._parallax(mouse_x, mouse_y);
		
	},
	_parallax: function(mx, my) {
				
		//if ( auto !== true ) {
		//	return;
		//}
		
		//parallax only when activeObject set
		if(!Scene._activeObect) {
			return false;
		}
		
		var sh_1	= 0.03;
		var sh_2	= -0.03;

		
		var x = (sh_1*(mx - document.body.clientWidth/2))+Scene._activeObect.position.x;
		var y = sh_2*(my - document.body.clientHeight/2)+Scene._activeObect.position.y + Scene._cameraInitialY;
		
		Scene._camera.position.x = x;
		Scene._camera.position.y = y;
		
		//Scene._moveCameraXY(Scene._camera.position, {x:x, y:y}, 0, true);
		
	 
	},
	
	_moveCameraXY: function(from, to, time, nonstop) {
		
		if(!Scene._cameraXYTween)
			Scene._cameraXYTween = new TWEEN.Tween( from )
									.to( to , time )
									.easing( TWEEN.Easing.Exponential.Out )
									.onComplete(function() {
										Scene._cameraXYTween = null;
									})
									.start();
		else {
			if(nonstop == undefined || !nonstop)
				Scene._cameraXYTween.stop().to( to , time ).start();
			else 
				Scene._cameraXYTween.to( to , time ).start();
		}
			
	},
	
	
	reset: function() {
		
		var i = Playlist.length();
		
		if(!i) {
			return false;
		}
		
		
		while(i--) {
			Scene._scene.remove( Playlist.items[ i ]['threeObject'] );
			Playlist.removeTrack(i);
		}
		
		Scene._availablePlaylistItems	= [];
		Scene._min_availableItemOffset	= null;
		Scene._max_availableItemOffset	= null;
		
		Playlist.reset();
		Player.reset();


		Scene._activeObect				= null;
		Scene._activeDomObect			= null;
		
		Scene._movingFromObject			= null;
		
		Scene._firstVisibleObjectZ		= null;
		Scene._lastVisibleObjectZ		= null;
		
		
		Scene._window_focus				= true;
	
	},
	
	animate: function() {
		
		requestAnimationFrame( Scene.animate );
				
		TWEEN.update();

		if( Scene._auto === true ) {
			Scene.move( 1 );
		}
		
		//Equalizer.render();
		if(Player._equalizer) {
			Player._equalizer.draw();
		}
		
		Scene._renderer.render( Scene._scene, Scene._camera );
	}
	
}

