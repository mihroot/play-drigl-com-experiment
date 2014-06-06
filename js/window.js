Window = {
	subscribers: {
		'onResize': []
	},
	deferred: [],
	params: {'indicator': '/img/misc/ajax-loader.gif', 'width': 500, 'dimmer': true, 'zindex': 10000},
	instances: [],
	wCounter: 0,
	mwWidth: 0,
	mwHeight: 0,
	topMin: 25,
	calcInited: false,
	dimmerLoaded: false,
	_sbWidth: null,
	sbWidth: function() {
		if (this._sbWidth === null) {
			var el = document.createElement( 'div' );
				el.innerHTML = '<div style="height: 75px;">1<br>1</div>';
				el.style.overflowY	= 'scroll';
				el.style.position	= 'absolute';
				el.style.width		= '50px';
				el.style.height		= '50px';
				
			document.getElementsByTagName('body')[0].appendChild(el);

			this._sbWidth = Math.max(0, el.offsetWidth - el.firstChild.offsetWidth - 1);
			document.body.removeChild(el);
		}
		return this._sbWidth;
	},
	calcParams: function(callback) {
				var w = window, de = document.documentElement, htmlNode = document.getElementsByTagName('html')[0],bodyNode = document.getElementsByTagName('body')[0]; 
				var dwidth = Math.max(toint(w.innerWidth), toint(de.clientWidth));
				var dheight = Math.max(toint(w.innerHeight), toint(de.clientHeight));
				var sbw = this.sbWidth(); var changed = false; 
								
				

				Window.mwWidth = dwidth;
				Window.mwHeight = dheight;

				Window.lastInnerWidth = (Window.mwWidth - sbw - 1);


				document.getElementById('dimmer').style.height = Window.mwHeight + 'px';
				document.getElementById('modal_layer_wrap').style.width = Window.mwWidth + 'px';
				document.getElementById('modal_layer_wrap').style.height = Window.mwHeight + 'px';
				document.getElementById('modal_layer').style.height = Window.mwHeight + 'px';

				
				if(typeof(callback) != 'undefined') {
					callback.call(null, Window.mwWidth, Window.mwHeight, Window.lastInnerWidth);
				}
				
				if(!this.calcInited) {
					this.calcInited = true;
					for(var k in Window.deferred) {
						Window.create.apply(this, this.deferred[k]);
					}
				}
	},
	onBodyResize: function() {
				
				Window.calcParams();		
				
				var height, width, top, left, win;
				for(w in Window.instances) {

					
					win = document.getElementById(Window.instances[w][0]);
					
					if(!Window.instances[w][2]){
						
						height	= parseInt(win.offsetHeight - parseInt(win.style.paddingTop));
						top		= parseInt((Window.mwHeight-height)/2);

						if(top <= Window.topMin) {
							
							//height = Window.mwHeight;
							top = Window.topMin;
						}
					} else {
						top = Window.topMin;
					}

					
					win.style.paddingTop = top + 'px';
				}
				
				for(var k in Window.subscribers['onResize']) {
					if(typeof(Window.subscribers['onResize'][k]) == 'string') {
						executeFunctionByName(Window.subscribers['onResize'][k]);
					} else {
						Window.subscribers['onResize'][k].call(null);
					}
				}
	},
	init: function() {
		
		window.addEventListener( 'resize', Window.onBodyResize, false );

	},
	body: function(c) {
		if(typeof(c) != 'undefined')
			return '.modal-window.' + c + ' .modal-window-body';
		else
			return false;
	},
	isOpened: function(c) {
		if(!Window.checkDuplicates(c))
			return true;
		else
			return false;
	},
	create: function(d, wClass, callback, nonMiddled, header, closable, onClose) {
		if(typeof(d) == 'undefined')
			return false;
		
		if(!this.calcInited) {
			this.deferred.push(arguments);
			return false;
		}
		
		Window.minimizeAll();
		
		//Place dimmer
		if(!Window.dimmerLoaded) {
			Window.placeDimmer();
		}
		

		
		if(typeof(wClass) == 'undefined')
			var wClass = '';			
		
		if(typeof(header) == 'undefined')
			var header = true;	
		
		if(typeof(closable) == 'undefined')
			var closable = true;
		
		if(typeof(onClose) == 'undefined')
			var onClose = false;	
	
		var winID = 'win_' + Window.wCounter;
		
		
		var modalWindow = document.createElement('div');
		modalWindow.id			= winID;
		modalWindow.className	= 'modal-window-container';
		
		modalWindow.innerHTML	= '<div class="modal-window ' + ((wClass)?' ' + wClass:'') +'">'+(header?'<div class="modal-window-header"><div class="desc"></div>'+(closable?'<a onclick="Window.close(\''+winID+'\');" class="close"><i class="icon-remove"></i>×</a>':'')+'</div>':'')+'<div class="modal-window-body"></div></div>';
		
		
		modalWindow.style.zIndex = Window.wCounter + 1 + Window.params.zindex;
			
			
		document.getElementById('modal_layer').appendChild(modalWindow);
		
		
		
		

		
		var width, height;
		if(!wClass)
			width = Window.params.width;
		else {
			width = modalWindow.offsetWidth;
			if(width <= 0) {
				width = Window.params.width;
			}
		}
		
		
		
		if(d.header) {
			//modalWindow
			var headerDesc = getChildByClassName('desc', modalWindow.getElementsByClassName('modal-window-header')[0]);
			headerDesc.innerHTML = d.header;
		}
		
		
		modalWindow.getElementsByClassName('modal-window-body')[0].innerHTML = d.body;
		
			
		var ptop;
		if(!nonMiddled) {
			
			height	= modalWindow.offsetHeight;
			ptop	= parseInt((Window.mwHeight-height)/2);
								
			if(ptop <= Window.topMin) {
				ptop = Window.topMin;
			}
		} else {
			ptop = Window.topMin;
		}


		modalWindow.style.paddingTop = ptop + 'px';
		if(!closable) {
			modalWindow.className = modalWindow.className + ' non-closable';
		}

		
		Window.instances.push([winID, wClass, nonMiddled, onClose]);
		Window.wCounter++;		
		
		
		if(typeof(callback) != 'undefined' && callback)
			callback.call(this, winID);
	},
	close: function(p) {
		
		var win = document.getElementById(p);
		
		document.getElementById('modal_layer').removeChild(win);


		
		var i = Window.instances.length;
		while(i--) {
			if(p == Window.instances[i][0]) {
				if(Window.instances[i][3]) {
					Window.instances[i][3].call();
				}
				Window.instances.splice(i, 1);
			}
		}
		
		
		var wiln = Window.instances.length;
		if(wiln > 0) {
			var winID = Window.instances[wiln-1][0];
			document.getElementById(winID).style.display = 'block';
		}
		else if(Window.params.dimmer && Window.dimmerLoaded) { //Remove dimmer if set
			Window.removeDimmer();
		}
			
		return false;
	},
	minimizeAll: function() {
		if(Window.instances.length <= 0) {
			return false;
		}
		
		var i; var winID;
		for(i in Window.instances) {
			winID = Window.instances[i][0];
			document.getElementById(winID).style.display = 'none';
		}

	},
	closeAll: function() {
		
		var i = Window.instances.length;
		if(i <= 0) {
			return false;
		}
		

		while(i--) {
			var winID = Window.instances[i][0];
			$('#' + winID).remove();
				
			Window.instances.splice(i, 1);
		}
	},
	checkDuplicates: function(c) {
		if(typeof(c) != 'undefined' && Window.instances.length) {
				if($('.modal-window.' + c).length)
					return false
		}
		return true;
	},
	placeDimmer: function() {
		
		
		document.getElementById('dimmer').style.display = 'block';
		document.getElementById('modal_layer_wrap').style.display = 'block';

		
		Window.params.zindex = parseInt(document.getElementById('modal_layer_wrap').style.zIndex);
		if(isNaN(Window.params.zindex))
			Window.params.zindex = 0;
		
		document.body.style.overflow = 'hidden';
		Window.dimmerLoaded = true;
		
		
		document.addEventListener('click', Window._closeWindowCheck, false);
	},
	
	removeDimmer: function() {
		
		document.getElementById('dimmer').style.display = 'none';
		document.getElementById('modal_layer_wrap').style.display = 'none';
		
		//document.body.style.overflow = 'auto';
		
		Window.dimmerLoaded = false;
		
		document.removeEventListener('click', Window._closeWindowCheck, false);
	},
	
	_closeWindowCheck: function(e) {
		var w = geByClass('modal-window', e.target);
		if(w) {
			for( var i in w ) {
				Window.close(w[i].parentNode.id);
			}
		}
     }

}

Window.init();