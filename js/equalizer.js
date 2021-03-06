/*!
 * gEqualizer JavaScript Library v1.0
 * https://github.com/mihroot
 *
 * Includes equalizer plugins from
 * https://github.com/surunzi/VisualMusic/
 *
 * Date: 2014-06-05T15:29Z
 */
 
 
var gEqualizer = function(audioAnalyser, c_node) {
	
	var o = this;
	
	this._audioAnalyser	= audioAnalyser;
	
	this._canvas		= c_node;
	this._ctx			= this._canvas.getContext('2d');
	
	this._canvas_width	= this._canvas.width	= window.innerWidth;
	this._canvas_height	= this._canvas.height	= window.innerHeight;
	
	
	this._current_eq_plugin_name	= null;
	this._current_eq_plugin			= null;
	
	
	var _onWindowResize = function() {
		o._canvas_width		= o._canvas.width	= window.innerWidth;
		o._canvas_height	= o._canvas.height	= window.innerHeight;
	}
	
	//Event listeners
	window.addEventListener( 'resize', _onWindowResize, false );
	
};




//Private methods
gEqualizer._available_plugins = [];
gEqualizer._pluginRegister = function(name, func) {
		
		if(typeof(gEqualizer.prototype[name]) != 'undefined') {
			throw 'Plugin \'' + name + '\' already exists.';
			return false;
		}
		
		gEqualizer._available_plugins.push(name);
		gEqualizer.prototype[name] = func;
				
		return true;
		
}
//-private methods


	
gEqualizer.prototype.draw = function() {
	
	if(!this._current_eq_plugin) {
		return false;
	}
		
	var freqByteData = new Uint8Array(this._audioAnalyser.frequencyBinCount);
	this._audioAnalyser.getByteFrequencyData(freqByteData);

	this._current_eq_plugin('draw', freqByteData);	
	
};


gEqualizer.prototype.nextPlugin = function( ) {
	
	var _a_offset = 0;
	
	if(this._current_eq_plugin) {
		
		for(var i in gEqualizer._available_plugins) {
			if( gEqualizer._available_plugins[i] == this._current_eq_plugin_name ) {
				_a_offset = ++i;
				break;
			}
		}

		if(_a_offset >= gEqualizer._available_plugins.length) {
			_a_offset = -1;
		}
	}
	
	if(_a_offset >= 0) {
		return this.setPlugin(gEqualizer._available_plugins[_a_offset]);
	} else {
		this.reset();
	}
	
	return false;
}


gEqualizer.prototype.setPlugin = function( name ) {
	
	if( typeof(gEqualizer.prototype[ name ]) == 'undefined'  
			|| (this._current_eq_plugin && this._current_eq_plugin == gEqualizer.prototype[ name ])) {
		return false;
	}
	
	if(this._current_eq_plugin) {
		this._current_eq_plugin('reset');
	}
	
	this._current_eq_plugin_name	= name;
	this._current_eq_plugin			= gEqualizer.prototype[ name ];
	
	//init plugin
	this._current_eq_plugin();
	
	return true;
	
};


gEqualizer.prototype.getCurrentPluginName = function( ) {
	
	if(this._current_eq_plugin) {
		return this._current_eq_plugin_name;
	}
	
	return false;
	
};



gEqualizer.prototype.reset = function( ) {

	if(this._current_eq_plugin) {
		this._current_eq_plugin('reset');
		
		this._current_eq_plugin = null;
		this._current_eq_plugin_name = null;
		
		this._ctx.clearRect(0, 0, this._canvas_width, this._canvas_height);
	}
	
	return true;
	
};




/**
 * Graphic Equalizer Plugin
 * @author mihroot
 */
(function( gEq ) {
	
	var methods	= {};
	
	
	// Plugin definition.
	gEq._pluginRegister('graph_01', function( method ) {
		
		if(typeof(method) === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else if(methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else {
			throw 'Method \'' + method + '\' does not exists.';
        }
			
	});
	
	

	methods.init = function (userOpts) {

	};
	
	methods.draw = function ( freqByteData ) {
		
		var fbd_length = freqByteData.length;
	
		var BAR_WIDTH		= Math.round( this._canvas_width / fbd_length );
		//var SPACER_WIDTH	= this._canvas_width * 0.1 / fbd_length;
	
			
		this._ctx.clearRect(0, 0, this._canvas_width, this._canvas_height);
			
		this._ctx.fillStyle	= '#87cc4e';//'#F6D565';
		this._ctx.lineCap	= 'round';
	
		for (var i = 0; i < fbd_length; ++i) {
			var magnitude = freqByteData[i];
			this._ctx.fillRect(i * BAR_WIDTH/* + i * SPACER_WIDTH */, this._canvas_height, BAR_WIDTH, - magnitude);
		}
		
	};
	
	methods.reset = function () {

	};
		

}(gEqualizer));






/**
 * Graphic Equalizer Plugin
 * @author surunzi
 * https://github.com/surunzi/VisualMusic/
 */
(function( gEq ) {
	
	var methods		= {};
	
	
	var _2PI 		= 2 * Math.PI;
	var _particles	= [],
		_particlesNum;
	
	
	// Plugin definition.
	gEq._pluginRegister('graph_02', function( method ) {
		
		if(typeof(method) === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else if(methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else {
			throw 'Method \'' + method + '\' does not exists.';
        }
			
	});


	methods.init = function (userOpts) {

		var colors = [	'105, 210, 231',
						'27, 103, 107',
						'190, 242, 2',
						'235, 229, 77',
						'0, 205, 172',
						'22, 147, 165',
						'249, 212, 35',
						'255, 78, 80',
						'231, 32, 78',
						'12, 202, 186',
						'255, 0, 111'];
			
		var i, 	width		= this._canvas_width, 
				height		= this._canvas_height,
				colorNum	= colors.length;
		
		_particlesNum = this._audioAnalyser.fftSize / 4;
		 	
		for (i = 0; i < _particlesNum; i++) {
				
			_particles.push({
				x: Math.random() * width,
				y: Math.random() * height,
				color: 'rgb(' + colors[Math.floor(Math.random() * colorNum)] + ')',
				size: 0,
				opacity: Math.random() + 0.2
			});
				
		}
		
	};
	
	methods.draw = function ( freqByteData ) {
		
		this._ctx.save();

		this._ctx.clearRect(0, 0, this._canvas_width, this._canvas_height);
		
		var i, p;
		for (i = 0; i < _particlesNum; i = i + 5) {
			
			p = _particles[i];
			
			if (p.size == 0 ) {
				p.size = freqByteData[i];
			} else {
				if (p.size < freqByteData[i]) {
					p.size += Math.floor((freqByteData[i] - p.size) / 5);
					p.opacity = p.opacity + 0.02;
					if (p.opacity > 1) {
						p.opacity = 1;
					}
				} else {
					p.size -= Math.floor((p.size - freqByteData[i]) / 5);
					if (freqByteData[i] == 0) {
						p.opacity = 0;
					} else {
						p.opacity = p.opacity - 0.02;
						if (p.opacity < 0) {
							p.opacity = 0;
							p.x = Math.random() * this._canvas_width;
							p.y = Math.random() * this._canvas_height;
						}
					}
				}
			}
			
			//Set opacity
			this._ctx.globalAlpha = p.opacity;
			
			this._ctx.fillStyle = p.color;
			this._ctx.beginPath();
			this._ctx.arc(p.x, p.y, p.size, 0, _2PI, true);
			this._ctx.closePath();
			this._ctx.fill();
			
		}
		
		this._ctx.restore();
		
	};
	
	methods.reset = function () {
		
		_particles	= [];
		
	};
	
	

}(gEqualizer));





/**
 * Graphic Equalizer Plugin
 * @author surunzi
 * https://github.com/surunzi/VisualMusic/
 */
(function( gEq ) {
	
	var methods		= {};
	
	
	var _bars = [],
		_dots = [];
	
	
	// Plugin definition.
	gEq._pluginRegister('graph_03', function( method ) {
		
		if(typeof(method) === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else if(methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else {
			throw 'Method \'' + method + '\' does not exists.';
        }
			
	});


	methods.init = function (userOpts) {
		
		var colors = [	'157, 193, 243',
						'245, 232, 153',
						'226, 51, 110'
					];

		
		var width		= this._canvas_width,
			height		= this._canvas_height,
				
			colorNum	= colors.length,
			barWidth	= Math.ceil(width / 64);
		
		
		for (var i = 0; i < 64; i++) {
			_dots.push(0);
			_bars.push({
				x: i * barWidth,
				w: barWidth,
				h: 0,
				color: colors[Math.floor(Math.random() * colors.length)],
			});
		}
		
	};
	
	methods.draw = function ( freqByteData ) {
					
		var b, i,
			total = 0,
			avarage = 0;
					
		this._ctx.clearRect(0, 0, this._canvas_width, this._canvas_height);
		
		for (i = 0; i < 64; i++) {
			
			b = _bars[i];
			
			if (b.h == 0) {
				b.h = freqByteData[i];
			} else {
				if (b.h < freqByteData[i]) {
					b.h += Math.floor((freqByteData[i] - b.h) / 2);
				} else {
					b.h -= Math.floor((b.h - freqByteData[i]) / 1.2);
				}
			}
			
			this._ctx.fillStyle = 'rgba(' + b.color + ', 1.0)';
			
			b.h *= 1.8;
			this._ctx.fillRect(b.x, this._canvas_height - b.h, b.w, b.h);
			
			if (_dots[i] < b.h) {
				_dots[i] = b.h;
			} else {
				_dots[i] -= 2;
			};
			
			this._ctx.fillStyle = 'rgba(' + b.color + ', 0.5)';
			this._ctx.fillRect(b.x, this._canvas_height - _dots[i] - b.w, b.w, b.w);
			
			total += freqByteData[i];
			
		}
		
		/*avarage = Math.floor(total / 64);
		this._ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
		this._ctx.fillRect(0, this._canvas_height - avarage, this._canvas_width, avarage);
		this._ctx.fillRect(this._canvas_width - avarage, 0, avarage, this._canvas_height);
		this._ctx.fillRect(0, 0, this._canvas_width, avarage);
		this._ctx.fillRect(0, 0, avarage, this._canvas_height);*/
	};
	
	methods.reset = function () {
		
		_bars = [];
		_dots = [];

	};
	

}(gEqualizer));





/**
 * Graphic Equalizer Plugin
 * @author surunzi
 * https://github.com/surunzi/VisualMusic/
 */
(function( gEq ) {
	
	var methods		= {};
	
	
	var _circles = [],
		_colors = [	'#fd2700', '#64d700', 'fdfb00', 
					'#8314fd', '#b8009c', '#fa60fd', 
					'#fa0000', '#e64200', '#0093f0', 
					'#fda0c0'],
		_currentColor,
		
		_speed			= 20,
		_addCount		= 0,
		_lastAvarage	= 0,
		_circleEnd		= 2 * Math.PI;
	
	
	// Plugin definition.
	gEq._pluginRegister('graph_04', function( method ) {
		
		if(typeof(method) === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else if(methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else {
			throw 'Method \'' + method + '\' does not exists.';
        }
			
	});


	methods.init = function (userOpts) {
		
		_currentColor = _colors[Math.floor(Math.random() * _colors.length)];
		for (var i = 0; i < 10; i++) {
			_circles.push({
				c: '',
				r: 0,
				a: 0
			});
		}

	};
	
	methods.draw = function ( freqByteData ) {
					
		this._ctx.save();
		
		var i, len, maxWidth,
			avarage = 0,
			total = 0,
			center = {
				x: Math.floor(this._canvas_width / 2),
				y: Math.floor(this._canvas_height / 2)
			};

		this._ctx.clearRect(0, 0, this._canvas_width, this._canvas_height);
		
		for (i = 0, len = freqByteData.length; i < len; i += 10) {
			total += freqByteData[i];
		}
		
		avarage = total / len * 10;

		this._ctx.fillStyle = _currentColor;
		this._ctx.beginPath();
		this._ctx.arc(center.x, center.y, avarage * 2, 0, _circleEnd, true);
		this._ctx.closePath();
		this._ctx.fill();
		

		this._ctx.lineWidth = 4;
		for (i = 0, len = _circles.length, maxWidth = this._canvas_width / 1.5; i < len; i++) {
			
			var c = _circles[i];
			if (c.a == 0) {
				continue;
			}
			
			this._ctx.strokeStyle = c.c;
			this._ctx.beginPath();
			this._ctx.arc(center.x, center.y, c.r, 0, _circleEnd, true);
			this._ctx.closePath();
			this._ctx.stroke();
			c.r += _speed;
			if (c.r > maxWidth) {
				c.a = 0;
			}
		}
		
		if (avarage < _lastAvarage) {
			if (_addCount > 2) {
				for (i = 0, len = _circles.length; i < len; i++) {
					if (_circles[i].a == 0) {
						_circles[i].c = _currentColor;
						_circles[i].r = avarage;
						_circles[i].a = 1;
						break;
					}
				}
			} else if (_addCount > 0) {
				_currentColor = _colors[Math.floor(Math.random() * _colors.length)];
			}
			_addCount = 0;
		} else {
			_addCount++;
		}
		
		_lastAvarage = avarage;
		
		this._ctx.restore();
	};
	
	methods.reset = function () {
		
		_circles		= [];	
		_addCount		= 0;
		_lastAvarage	= 0;

	};
	

}(gEqualizer));



/**
 * Graphic Equalizer Plugin
 * @author surunzi
 * https://github.com/surunzi/VisualMusic/
 */
(function( gEq ) {
	
	var methods		= {};
	
	var _particleNum;
	var _particles = [];
	
	var _2PI = Math.PI * 2;
	
	// Plugin definition.
	gEq._pluginRegister('graph_05', function( method ) {
		
		if(typeof(method) === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else if(methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else {
			throw 'Method \'' + method + '\' does not exists.';
        }
			
	});


	methods.init = function (userOpts) {
		
		var colors = [	'105, 210, 231',
						'27, 103, 107',
						'190, 242, 2',
						'235, 229, 77',
						'0, 205, 172',
						'22, 147, 165',
						'249, 212, 35',
						'255, 78, 80',
						'231, 32, 78',
						'12, 202, 186',
						'255, 0, 111'
						];
		
		_particleNum = this._audioAnalyser.fftSize / 8;
		
		for(var i = 0; i < _particleNum; i++){
			_particles.push( {
				x: Math.round(Math.random() * this._canvas_width),
				y: Math.round(Math.random() * this._canvas_height),
				rad: Math.round(Math.random() * 10) + 15,
				rgba: 'rgba('+colors[Math.floor(Math.random() * colors.length)]+', 1)',
				vx: Math.round(Math.random() * 3) - 1.5,
				vy: Math.round(Math.random() * 3) - 1.5
			});
		}

	};
	
	methods.draw = function ( freqByteData ) {
					
		this._ctx.save();
		
		var i, j, total, avg, p, p2, factor;
		
		this._ctx.clearRect(0, 0, this._canvas_width, this._canvas_height);
		
		this._ctx.globalCompositeOperation = 'lighter';
		this._ctx.linewidth = 0.5;
	
		for (i = 0, total = 0; i < _particleNum; i++) {
			total += freqByteData[i];
		}
		avg = total / _particleNum;
	
		for(i = 0; i < _particleNum; i++){
			
			p = _particles[i];
			factor = 1;
			
			for(j = 0; j < _particleNum; j++){
			   p2 = _particles[j];
			   if(p.rgba == p2.rgba && _findDistance(p, p2) < avg){
				  this._ctx.strokeStyle = p.rgba;
				  this._ctx.beginPath();
				  this._ctx.moveTo(p.x, p.y);
				  this._ctx.lineTo(p2.x, p2.y);
				  this._ctx.stroke();
				  factor += 0.6;
			   }
			}
	
			this._ctx.fillStyle		= p.rgba;
			this._ctx.strokeStyle	= p.rgba;
			
			this._ctx.beginPath();
			this._ctx.arc(p.x, p.y, p.rad * factor, 0, _2PI, true);
			this._ctx.fill();
			this._ctx.closePath();
			
			this._ctx.beginPath();
			this._ctx.arc(p.x, p.y, (p.rad + 5) * factor, 0, _2PI, true);
			this._ctx.stroke();
			this._ctx.closePath();
	
			p.x += p.vx;
			p.y += p.vy;
			
			if(p.x > this._canvas_width + p.rad) p.x = 0;
			if(p.x < -p.rad) p.x = this._canvas_width;
			if(p.y > this._canvas_height + p.rad) p.y = 0;
			if(p.y < -p.rad) p.y = this._canvas_height;
		}
		
		this._ctx.restore();
	};
	
	methods.reset = function () {
		
		_particles		= [];


	};
	
	
	function _findDistance(p1, p2){  
		return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
	}
	

}(gEqualizer));



/**
 * Graphic Equalizer Plugin
 * @author surunzi
 * https://github.com/surunzi/VisualMusic/
 */
(function( gEq ) {
	
	var methods		= {};
	
	
	var _sinAngle = [];
	var _color;
	
	// Plugin definition.
	gEq._pluginRegister('graph_06', function( method ) {
		
		if(typeof(method) === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else if(methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else {
			throw 'Method \'' + method + '\' does not exists.';
        }
			
	});


	methods.init = function (userOpts) {
		
		var angleGap = Math.random() * 0.1 + 0.05,
			angle = 0, angle2 = 0;
		
		var len = this._audioAnalyser.fftSize / 2 - 20;
			
		_sinAngle[0] = Math.sin(angle);
		for (var i = 1; i < len; i++) {
			_sinAngle.push(Math.sin(angle));
			if (_sinAngle[i - 1] > 0 && _sinAngle[i] < 0 ||  _sinAngle[i - 1] < 0 && _sinAngle[i] > 0) {
				angleGap = Math.random() * 0.1 + 0.05;
			}
			angle += angleGap;
		}
		
		
		_initColor(this._ctx, this._canvas_height);

	};
	
	methods.draw = function ( freqByteData ) {
					
		this._ctx.save();
		
		var x, i, gap, xc, yc;
		
		var line	= [];
		var len		= _sinAngle.length;
		var halfH	= this._canvas_height / 2;
		
		this._ctx.clearRect(0, 0, this._canvas_width, this._canvas_height);
		for (i = 0; i < len; i++) {
			line.push(freqByteData[i] * _sinAngle[i]);
		}
	
		this._ctx.shadowColor	= '#fffa47';
		this._ctx.shadowBlur	= 15;
		this._ctx.strokeStyle	= _color;
		this._ctx.lineWidth		= 2;
		
		this._ctx.beginPath();
		
		x = 0;
		gap = Math.ceil(this._canvas_width / len);
		
		this._ctx.moveTo(x, halfH);
		for (i = 1; i < len - 2; i ++) {
			xc = (x + x + gap) / 2;
			yc = halfH - (line[i] + line[i + 1]) / 2;
			this._ctx.quadraticCurveTo(x, halfH - line[i], xc, yc);
			x += gap;
		}
		this._ctx.quadraticCurveTo(x, halfH - line[i], x + gap, halfH - line[i + 1]);
		this._ctx.stroke();
		
		this._ctx.restore();
		
	};
	
	methods.reset = function () {
		
		_sinAngle		= [];	

	};
	
	
	function _initColor (ctx, height) {

		_color = ctx.createLinearGradient(0, 0, 0, height);
		
		_color.addColorStop(0.1, '#ff5614');
		_color.addColorStop(0.3, '#fffa47');
		_color.addColorStop(0.4, '#f93b04');
		_color.addColorStop(0.5, '#f93b04');
		_color.addColorStop(0.6, '#fffa47');
		_color.addColorStop(0.7, '#f93b04');
		_color.addColorStop(0.75, '#f01800');
		_color.addColorStop(0.8, '#fb7220');
		_color.addColorStop(0.9, '#f93b04');
		_color.addColorStop(1, '#f01800');
		
	}
	

}(gEqualizer));