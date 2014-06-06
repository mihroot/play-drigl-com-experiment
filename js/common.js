
function degreestoradians(degrees){ return degrees * Math.PI/180; }
function radianstodegrees (radians) { return radians * 180/Math.PI; }


function toint(i) {
	i = parseInt(i);
	if(isNaN(i))
		i = 0;
	return i;
}


function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function isArray(a) {
	return Object.prototype.toString.call( a ) === '[object Array]';
}

/**
 * Returns a random number between min and max
 */
function getRandomArbitary (min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Returns a random integer between min and max
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getChildByClassName(c, p) {
	var pattern = new RegExp('(^|\\s)' + c + '(\\s|$)');
	for (var i = 0; i < p.childNodes.length; i++) {
		if (pattern.test(p.childNodes[i].className)) {
			return p.childNodes[i];
		}        
	}
}

function ge(el) {
  return (typeof el == 'string' || typeof el == 'number') ? document.getElementById(el) : el;
}
function geByTag(searchTag, node) {
  node = ge(node) || document;
  return node.getElementsByTagName(searchTag);
}
function geByClass(searchClass, node, tag) {
  node = ge(node) || document;
  tag = tag || '*';
  var classElements = [];

  if (node.querySelectorAll && tag != '*') {
    return node.querySelectorAll(tag + '.' + searchClass);
  }
  if (node.getElementsByClassName) {
    var nodes = node.getElementsByClassName(searchClass);
    if (tag != '*') {
      tag = tag.toUpperCase();
      for (var i = 0, l = nodes.length; i < l; ++i) {
        if (nodes[i].tagName.toUpperCase() == tag) {
          classElements.push(nodes[i]);
        }
      }
    } else {
      classElements = Array.prototype.slice.call(nodes);
    }
    return classElements;
  }

  var els = geByTag(tag, node);
  var pattern = new RegExp('(^|\\s)' + searchClass + '(\\s|$)');
  for (var i = 0, l = els.length; i < l; ++i) {
    if (pattern.test(els[i].className)) {
      classElements.push(els[i]);
    }
  }
  return classElements;
}
// Extending object by another
function extend() {
  var a = arguments, target = a[0] || {}, i = 1, l = a.length, deep = false, options;

  if (typeof target === 'boolean') {
    deep = target;
    target = a[1] || {};
    i = 2;
  }

  if (typeof target !== 'object' && !isFunction(target)) target = {};

  for (; i < l; ++i) {
    if ((options = a[i]) != null) {
      for (var name in options) {
        var src = target[name], copy = options[name];

        if (target === copy) continue;

        if (deep && copy && typeof copy === 'object' && !copy.nodeType) {
          target[name] = extend(deep, src || (copy.length != null ? [] : {}), copy);
        } else if (copy !== undefined) {
          target[name] = copy;
        }
      }
    }
  }

  return target;
}

function hide(node) {
	node.style.display = 'none';
}

function show(node) {
	node.style.display = '';
}




function clone(obj) {
	
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}


function executeFunctionByName(functionName, thisArg, args ) {
	var context = window;
	//var args = Array.prototype.slice.call(arguments).splice(2, arguments.length); //opera 9.5 needs 2'nd parameter to be set
	var namespaces = functionName.split(".");
	var func = namespaces.pop();
	for(var i = 0; i < namespaces.length; i++) {
		context = context[namespaces[i]];
	}
	return context[func].apply(thisArg, args);
}


if (!Date.now) {
    Date.now = function() { return new Date().getTime(); };
}




/* Modernizr 2.8.2 (Custom Build) | MIT & BSD
 * Build: http://modernizr.com/download/#-csstransforms3d-touch-cssclasses-teststyles-testprop-testallprops-prefixes-domprefixes
 */
;window.Modernizr=function(a,b,c){function z(a){j.cssText=a}function A(a,b){return z(m.join(a+";")+(b||""))}function B(a,b){return typeof a===b}function C(a,b){return!!~(""+a).indexOf(b)}function D(a,b){for(var d in a){var e=a[d];if(!C(e,"-")&&j[e]!==c)return b=="pfx"?e:!0}return!1}function E(a,b,d){for(var e in a){var f=b[a[e]];if(f!==c)return d===!1?a[e]:B(f,"function")?f.bind(d||b):f}return!1}function F(a,b,c){var d=a.charAt(0).toUpperCase()+a.slice(1),e=(a+" "+o.join(d+" ")+d).split(" ");return B(b,"string")||B(b,"undefined")?D(e,b):(e=(a+" "+p.join(d+" ")+d).split(" "),E(e,b,c))}var d="2.8.2",e={},f=!0,g=b.documentElement,h="modernizr",i=b.createElement(h),j=i.style,k,l={}.toString,m=" -webkit- -moz- -o- -ms- ".split(" "),n="Webkit Moz O ms",o=n.split(" "),p=n.toLowerCase().split(" "),q={},r={},s={},t=[],u=t.slice,v,w=function(a,c,d,e){var f,i,j,k,l=b.createElement("div"),m=b.body,n=m||b.createElement("body");if(parseInt(d,10))while(d--)j=b.createElement("div"),j.id=e?e[d]:h+(d+1),l.appendChild(j);return f=["&#173;",'<style id="s',h,'">',a,"</style>"].join(""),l.id=h,(m?l:n).innerHTML+=f,n.appendChild(l),m||(n.style.background="",n.style.overflow="hidden",k=g.style.overflow,g.style.overflow="hidden",g.appendChild(n)),i=c(l,a),m?l.parentNode.removeChild(l):(n.parentNode.removeChild(n),g.style.overflow=k),!!i},x={}.hasOwnProperty,y;!B(x,"undefined")&&!B(x.call,"undefined")?y=function(a,b){return x.call(a,b)}:y=function(a,b){return b in a&&B(a.constructor.prototype[b],"undefined")},Function.prototype.bind||(Function.prototype.bind=function(b){var c=this;if(typeof c!="function")throw new TypeError;var d=u.call(arguments,1),e=function(){if(this instanceof e){var a=function(){};a.prototype=c.prototype;var f=new a,g=c.apply(f,d.concat(u.call(arguments)));return Object(g)===g?g:f}return c.apply(b,d.concat(u.call(arguments)))};return e}),q.touch=function(){var c;return"ontouchstart"in a||a.DocumentTouch&&b instanceof DocumentTouch?c=!0:w(["@media (",m.join("touch-enabled),("),h,")","{#modernizr{top:9px;position:absolute}}"].join(""),function(a){c=a.offsetTop===9}),c},q.csstransforms3d=function(){var a=!!F("perspective");return a&&"webkitPerspective"in g.style&&w("@media (transform-3d),(-webkit-transform-3d){#modernizr{left:9px;position:absolute;height:3px;}}",function(b,c){a=b.offsetLeft===9&&b.offsetHeight===3}),a};for(var G in q)y(q,G)&&(v=G.toLowerCase(),e[v]=q[G](),t.push((e[v]?"":"no-")+v));return e.addTest=function(a,b){if(typeof a=="object")for(var d in a)y(a,d)&&e.addTest(d,a[d]);else{a=a.toLowerCase();if(e[a]!==c)return e;b=typeof b=="function"?b():b,typeof f!="undefined"&&f&&(g.className+=" "+(b?"":"no-")+a),e[a]=b}return e},z(""),i=k=null,e._version=d,e._prefixes=m,e._domPrefixes=p,e._cssomPrefixes=o,e.testProp=function(a){return D([a])},e.testAllProps=F,e.testStyles=w,g.className=g.className.replace(/(^|\s)no-js(\s|$)/,"$1$2")+(f?" js "+t.join(" "):""),e}(this,this.document);



Utils = {
		
		
		serialize: function(obj, prefix) {
			var str = [];
			for(var p in obj) {
				var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
				str.push(typeof v == "object" ? 
					Utils.serialize(v, k) :
					encodeURIComponent(k) + "=" + encodeURIComponent(v));
			}
			return str.join("&");
		},
		
		
		width: function(e) {
			var w;
			var clone = e.cloneNode(true);
			document.body.appendChild(clone);
			clone.style.display = 'block';
			w = parseInt(clone.offsetWidth);
			document.body.removeChild(clone);
			
			return w;
		},
		
		
		subscribers: {},
		bind: function(a, f, n) {
			if(typeof(Utils.subscribers[a]) == 'undefined') {
				Utils.subscribers[a] = [];
			}
			
			if(typeof(n) == 'undefined') {
				n = null;
			}
			
			Utils.subscribers[a].push([f, n]);
		},
		unbind: function(a, n) {
			if(typeof(Utils.subscribers[a]) == 'undefined') {
				return false;
			}
			
			if(typeof(n) == 'undefined') {
				n = null;
			}
							
			var l = Utils.subscribers[a].length;
			while(l--) {
				if(Utils.subscribers[a][l][1] === n) {
					Utils.subscribers[a].splice(l, 1);
				}
			}
			
			if(Utils.subscribers[a].length <= 0)
				delete Utils.subscribers[a];
		},
		trigger: function(a, p) {
			
			if(typeof(Utils.subscribers[a]) == 'undefined') {
				return false;
			}
			
			if(typeof(p) == 'undefined') {
				p = [];
			} else {
				p = [p];
			}
			
			for(var k in Utils.subscribers[a]) {
				if(typeof(Utils.subscribers[a][k][0]) == 'string') {
					executeFunctionByName(Utils.subscribers[a][k][0], window, p);
				} else {
					Utils.subscribers[a][k][0].apply(window, p);
				}
			}
		}
}


Cookie = {
	get: function(name) {
		var cookie = " " + document.cookie;
		var search = " " + name + "=";
		var setStr = null;
		var offset = 0;
		var end = 0;
		if (cookie.length > 0) {
			offset = cookie.indexOf(search);
			if (offset != -1) {
				offset += search.length;
				end = cookie.indexOf(";", offset);
				if (end == -1) {
					end = cookie.length;
				}
				setStr = unescape(cookie.substring(offset, end));
			}
		}
		return (setStr);
	},
	set: function(name, value, expires, path, domain, secure) {
		document.cookie = name + "=" + escape(value) + ((expires) ? "; expires=" + expires : "") + ((path) ? "; path=" + path : "") + ((domain) ? "; domain=" + domain : "") + ((secure) ? "; secure" : "");
	}
}	