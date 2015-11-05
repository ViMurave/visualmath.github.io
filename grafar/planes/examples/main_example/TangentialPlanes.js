(function() {
		function vecSum(a, b) {
			var l = a.length;
			if (l != b.length)
				return NaN;
			var c = new Array(l);
			for (i = 0; i < l; i++)
				c[i] = a[i] + b[i];
			return c;
		}
		function vecSub(a, b) {
			var l = a.length;
			if (l != b.length)
				return Nan;
			var c = new Array(l);
			for (i = 0; i < l; i++)
				c[i] = a[i] - b[i];
			return c;
		}
		function vecMul(a, mul) {
			var l = a.length;
			for (i = 0; i < l; i++)
				a[i] = a[i] * mul;
			return a;
		}
		function vecProduct(a, b) {
			var l = a.length;
			if (b.length != l)
				return NaN;
			var c = new Array(2);
			c[0] = a[0]*b[1];
			c[1] = -a[1]*b[0];
			return c;
		}
		function vecDiv(a, div) {
			if (div == 0)
				return NaN;
			var l = a.length;
			for (i = 0; i < l; i++)
				a[i] = a[i] / div;
			return a;
		}
		function vecCopy(a) {
			var l = a.length,
				b = new Array(l);
			for (var i = 0; i < l; i++)
				b[i] = a[i];
			return b;
		}
		
		function Cartesian(a) {
			var c = [problem.eqn_comp[1](a[2], a[0], a[1]),
					problem.eqn_comp[2](a[2], a[0], a[1]),
					problem.eqn_comp[3](a[2], a[0], a[1])
			];
			return c;
		}
		
		grafar.config.debug = false;
        function getProblemById(id) {
            return problems.filter(function(pr) {
                return pr.id === id;
            })[0];
        };
		
		// var infoDiv = document.getElementById('info');
		// problems.forEach(function(pr) {
			// pr.div = document.createElement('div');
			// pr.div.innerHTML = pr.info;
		// });
		
		var panelMainDiv = document.getElementById('plot3d_main');
		panelMainDiv.addEventListener('mouseover', eulerface.lockScroll);
		panelMainDiv.addEventListener('mouseout', eulerface.unlockScroll);
		
		var xInpDiv = document.getElementById('x_input'),
			yInpDiv = document.getElementById('y_input');
		xInpDiv.addEventListener('change', updateTangPoint);
		yInpDiv.addEventListener('change', updateTangPoint);
		
		var x1ptDiv = document.getElementById('x_pt1'),
			y1ptDiv = document.getElementById('y_pt1'),
			x2ptDiv = document.getElementById('x_pt2'),
			y2ptDiv = document.getElementById('y_pt2');
		x1ptDiv.addEventListener('change', updateProblem);
		x2ptDiv.addEventListener('change', updateProblem);
		y1ptDiv.addEventListener('change', updateProblem);
		y2ptDiv.addEventListener('change', updateProblem);
				
		//А вот это ui наверное можно будет убрать, хотя и так хорошо
		grafar.ui([
			{type: 'checkbox', id: 'animation', bind: animate},
			{type: 'label', init: 'Анимация'},
			{type: 'br'},
			{type: 'checkbox', id: 'auto_pt_select', bind: blockPointSelect},
			{type: 'label', init: 'Авто выбор точек'}
		], {container: 'options'});
		document.getElementById('auto_pt_select').setAttribute('checked', true);
		
		var pan3d_main = new grafar.Panel(document.getElementById('plot3d_main'));
		
		var main_graf = new grafar.Object().pin(pan3d_main),
			tang_plane = new grafar.Object().pin(pan3d_main),
			tang_point_graf = new grafar.Object().pin(pan3d_main),
			extr_point_graf = new grafar.Object().pin(pan3d_main),
			animate_forward = true,
			problem,
			allowAnimate = false;
			
		var points = {
			point_1: [0, 0],
			point_2: [0, 0]
		}
		var Main_point = [0, 0];
		var xVec = vecCopy(points.point_1),
			yVec = vecCopy(points.point_2);
		
		pan3d_main.camera.position.set(-2, 2, 2);
		
		function planePoints(points) {
			var eigVec_1 = vecSub(Cartesian(points._2), Cartesian(points._1)),
				eigVec_2 = vecSub(Cartesian(points._3), Cartesian(points._1));
			var volume = vecProduct(eigVec_1, eigVec_2);
			if (grafar.norm2(volume) < 0.3)
				return false;
			else
				return true;
		}
		
		function updateTangPoint() {
			var xInp = parseFloat(document.getElementById('x_input').value),
				yInp = parseFloat(document.getElementById('y_input').value);
			var dx = xInp - Main_point[0],
				dy = yInp - Main_point[1];
			Main_point[0] = xInp;
			Main_point[1] = yInp;
			points.point_1[0] = points.point_1[0] + dx;
			points.point_1[1] = points.point_1[1] + dy;
			points.point_2[0] = points.point_2[0] + dx;
			points.point_2[1] = points.point_2[1] + dy;
			document.getElementById('x_pt1').value = points.point_1[0].toFixed(1);	//Округление до десятых
			document.getElementById('y_pt1').value = points.point_1[1].toFixed(1);
			document.getElementById('x_pt2').value = points.point_2[0].toFixed(1);
			document.getElementById('y_pt2').value = points.point_2[1].toFixed(1);
			updateProblem();
		}
		
		function blockPointSelect() {
			var autoPtSelect = document.getElementById('auto_pt_select').checked;
			if (autoPtSelect) {
				document.getElementById('x_pt1').disabled = true;
				document.getElementById('y_pt1').disabled = true;
				document.getElementById('x_pt2').disabled = true;
				document.getElementById('y_pt2').disabled = true;
			}
			else {
				document.getElementById('x_pt1').disabled = false;
				document.getElementById('y_pt1').disabled = false;
				document.getElementById('x_pt2').disabled = false;
				document.getElementById('y_pt2').disabled = false;
			}
			updateProblem();
		}
		
		function updateProblem() {
			var autoPtSelect = document.getElementById('auto_pt_select').checked;
			var x1pt, x2pt, y1pt, y2pt;
			
			problem = getProblemById(sel1.container.getAttribute('value'));
			var eqn = problem.eqn_comp;
			var problemId = sel1.container.getAttribute('value');		// <--- Don't need this
			
			if (autoPtSelect) {
				points.point_1[0] = Main_point[0] + 0.5;
				points.point_1[1] = Main_point[1];
				points.point_2[0] = Main_point[0];
				points.point_2[1] = Main_point[1] + 0.5;
			}
			else {
				x1pt = parseFloat(document.getElementById('x_pt1').value);
				x2pt = parseFloat(document.getElementById('x_pt2').value);
				y1pt = parseFloat(document.getElementById('y_pt1').value);
				y2pt = parseFloat(document.getElementById('y_pt2').value);
				points.point_1[0] = x1pt;
				points.point_1[1] = y1pt;
				points.point_2[0] = x2pt;
				points.point_2[1] = y2pt;
			}
			
			Main_point[2] = eqn[0](Main_point[0], Main_point[1]);
			points.point_1[2] = eqn[0](points.point_1[0], points.point_1[1]);
			points.point_2[2] = eqn[0](points.point_2[0], points.point_2[1]);
			
			xVec = vecSub(Cartesian(points.point_1), Cartesian(Main_point));
			yVec = vecSub(Cartesian(points.point_2), Cartesian(Main_point));
			
			xVec = vecDiv(xVec, grafar.norm2(xVec));
			yVec = vecDiv(yVec, grafar.norm2(yVec));
			
			//Check for points on one line - need to make smth new
			
			/*allowAnimate = planePoints({_1: Main_point, _2: points.point_1, _3: points.point_2});
			if (!allowAnimate) {
				document.getElementById('animation').disabled = true;
			}
			else {
				document.getElementById('animation').disabled = false;
			}*/
			
			// hideAllBut(
                // document.getElementById('solution1'), 
                // document.getElementById('solution-' + problemId));
			
			//Plotting Main function
			main_graf.reset()
					.constrain({what: 'phi', maxlen: 120, as: grafar.seq(0, 2 * Math.PI, 'phi')})
					.constrain({what: 'ksi', maxlen: 60, as: grafar.seq(-0.5 * Math.PI, 0.5 * Math.PI, 'ksi')})
					.constrain({what: 'r', using: 'phi, ksi', as: function (data, l) {
						var phi = data.phi, ksi = data.ksi;
						for (var i = 0; i < l; i++) {
							data.r[i] = eqn[0](phi[i], ksi[i]);
						}
					 }})
					 .constrain({what: 'x, y, z', using: 'r, phi, ksi', as: function(data, l) {
						 var r = data.r, phi = data.phi, ksi = data.ksi;
						 for (var i = 0; i < l; i++) {
							 data.x[i] = eqn[1](r[i], phi[i], ksi[i]);
							 data.y[i] = eqn[2](r[i], phi[i], ksi[i]);
							 data.z[i] = eqn[3](r[i], phi[i], ksi[i]);
						 }
					 }})
					 .refresh();
			main_graf.glinstances[0].object.children[0].material.color.r = 65/255;
			main_graf.glinstances[0].object.children[0].material.color.g = 105/255;
			main_graf.glinstances[0].object.children[0].material.color.b = 255/255;
			
			//Ploting starting tangential plane
			tang_plane.reset()
						.constrain({what: 't', maxlen: 30, as: grafar.seq(-1.5, 1.5, 't')})
						.constrain({what: 's', maxlen: 30, as: grafar.seq(-1.5, 1.5, 's')})
						.constrain({what: 'x, y, z', using: 't, s', as: function(data, l) {
							var t = data.t, s = data.s;
							var CartMain = Cartesian(Main_point);
							for (var i = 0; i < l; i++) {
								data.x[i] = CartMain[0] + t[i] * xVec[0] + s[i] * yVec[0];
								data.y[i] = CartMain[1] + t[i] * xVec[1] + s[i] * yVec[1];
								data.z[i] = CartMain[2] + t[i] * xVec[2] + s[i] * yVec[2];
							}
						}})
						.refresh();
			tang_plane.glinstances[0].object.children[0].material.color.r = 255/255;
			tang_plane.glinstances[0].object.children[0].material.color.g = 105/255;
			tang_plane.glinstances[0].object.children[0].material.color.b = 100/255;
			
			//Plotting Extra Points on main graph
			extr_point_graf.reset();
			extr_point_graf.constrain({what: 'x, y, z', maxlen: 2, as: function(data, l) {
							var x = data.x, y = data.y, z = data.z;
							var k = 0;
							for (var i in points) {
								var polarP = [
									points[i][0],
									points[i][1],
									points[i][2]
								];
								var CartP = Cartesian(polarP);
								x[k] = CartP[0];
								y[k] = CartP[1];
								z[k] = CartP[2];
								k++;
							}
						}})
						.refresh();
			extr_point_graf.glinstances[0].object.children[0].visible = true;
			extr_point_graf.glinstances[0].object.children[1].visible = false;
			extr_point_graf.glinstances[0].object.children[0].material.transparent = false;
			extr_point_graf.glinstances[0].object.children[0].material.size = 20;
			extr_point_graf.glinstances[0].object.children[0].material.color.r = 255/255;
			extr_point_graf.glinstances[0].object.children[0].material.color.g = 25/255;
			extr_point_graf.glinstances[0].object.children[0].material.color.b = 0;
			
			//Plotting tangential point (where the tangential plane is built)
			tang_point_graf.reset();
			tang_point_graf.constrain({what: 'x, y, z', maxlen: 1, as: function(data, l) {
							var x = data.x, y = data.y, z = data.z;
							var PolarP = [
								Main_point[0],
								Main_point[1],
								Main_point[2]
							];
							var CartP = Cartesian(PolarP);
							x[0] = CartP[0];
							y[0] = CartP[1];
							z[0] = CartP[2];
						}})
						.refresh();
			tang_point_graf.glinstances[0].object.children[0].visible = true;
			tang_point_graf.glinstances[0].object.children[1].visible = false;
			tang_point_graf.glinstances[0].object.children[0].material.transparent = false;
			tang_point_graf.glinstances[0].object.children[0].material.size = 20;
			tang_point_graf.glinstances[0].object.children[0].material.color.r = 25/255;
			tang_point_graf.glinstances[0].object.children[0].material.color.g = 255/255;
			tang_point_graf.glinstances[0].object.children[0].material.color.b = 25/255;
		}
		
		function animate() {
			var frame_rate = 150;			
			var i = 0,
				f = problem.eqn_comp,
				_1pt, _2pt,
				show_pt,
				eig1 = [points.point_1[0] - Main_point[0],
					points.point_1[1] - Main_point[1]],
				eig2 = [points.point_2[0] - Main_point[0],
					points.point_2[1] - Main_point[1]];
			function frame() {				
				if (i < frame_rate && animate_forward == true) {
					show_pt = true;
					
					_1pt = vecCopy(points.point_1);
					_1pt[0] = Main_point[0] + eig1[0] * (frame_rate - i) / frame_rate;
					_1pt[1] = Main_point[1] + eig1[1] * (frame_rate - i) / frame_rate;
					_1pt[2] = f(_1pt[0], _1pt[1]);
					xVec = vecSub(_1pt, Main_point);
					xVec = vecDiv(xVec, grafar.norm2(xVec));
					
					_2pt = vecCopy(points.point_2);
					_2pt[0] = Main_point[0] + eig2[0] * (frame_rate - i) / frame_rate;
					_2pt[1] = Main_point[1] + eig2[1] * (frame_rate - i) / frame_rate;
					_2pt[2] = problem.eqn_comp(_2pt[0], _2pt[1]);
					yVec = vecSub(_2pt, Main_point);
					yVec = vecDiv(yVec, grafar.norm2(yVec));
				}
				else if (i >= frame_rate && animate_forward == true) {
					show_pt = false;
					
					_1pt = vecCopy(Main_point);
					_1pt[0] += 0.001 * eig1[0];
					_1pt[1] += 0.001 * eig1[1];
					_1pt[2] = f(_1pt[0], _1pt[1]);
					xVec = vecSub(_1pt, Main_point);
					xVec = vecDiv(xVec, grafar.norm2(xVec));
					_2pt = vecCopy(Main_point);
					_2pt[0] += 0.001 * eig2[0];
					_2pt[1] += 0.001 * eig2[1];
					_2pt[2] = f(_2pt[0], _2pt[1]);
					yVec = vecSub(_2pt, Main_point);
					yVec = vecDiv(yVec, grafar.norm2(yVec));
				}
				else if (i < frame_rate && animate_forward == false) {
					show_pt = true;
					if (i == 0)
						i++;
					_1pt = vecCopy(points.point_1);
					_1pt[0] = Main_point[0] + eig1[0] * i / frame_rate;
					_1pt[1] = Main_point[1] + eig1[1] * i / frame_rate;
					_1pt[2] = f(_1pt[0], _1pt[1]);
					xVec = vecSub(_1pt, Main_point);
					xVec = vecDiv(xVec, grafar.norm2(xVec));
					
					_2pt = vecCopy(points.point_2);
					_2pt[0] = Main_point[0] + eig2[0] * i / frame_rate;
					_2pt[1] = Main_point[1] + eig2[1] * i / frame_rate;
					_2pt[2] = problem.eqn_comp(_2pt[0], _2pt[1]);
					yVec = vecSub(_2pt, Main_point);
					yVec = vecDiv(yVec, grafar.norm2(yVec));
				}
				else {
					show_pt = true;
					_1pt = vecCopy(points.point_1);
					_2pt = vecCopy(points.point_2);
					xVec = vecSub(points.point_1, Main_point);
					xVec = vecDiv(xVec, grafar.norm2(xVec));
					yVec = vecSub(points.point_2, Main_point);
					yVec = vecDiv(yVec, grafar.norm2(yVec));
				}
				tang_plane.constrain({what: 'x, y, z', using: 't, s', as:
					function(data, l) {
						var t = data.t, s = data.s;
						for (var k = 0; k < l; k++) {
							data.x[k] = Main_point[0] + t[k] * xVec[0] + s[k] * yVec[0];
							data.y[k] = Main_point[1] + t[k] * xVec[1] + s[k] * yVec[1];
							data.z[k] = Main_point[2] + t[k] * xVec[2] + s[k] * yVec[2]; 
						}
					}})
					.refresh();
				extr_point_graf.reset();
				if (show_pt) {
					extr_point_graf.constrain({what: 'x, y, z', maxlen: 2, as: function(data, l) {
						var x = data.x, y = data.y, z = data.z;
						x[0] = _1pt[0], y[0] = _1pt[1], z[0] = _1pt[2];
						x[1] = _2pt[0], y[1] = _2pt[1], z[1] = _2pt[2];
					}});
				}
				extr_point_graf.refresh();
				if (show_pt)
					extr_point_graf.glinstances[0].object.children[0].visible = true;
				else
					extr_point_graf.glinstances[0].object.children[0].visible = false;
				i++;
				if (i <= frame_rate)
					window.requestAnimationFrame(frame);
				else
					animate_forward = !animate_forward;
			}
			frame();
		}
		
		hideAllBut = function(container, visible) {
            var children = container.children;
            for (var i = 0; i < children.length; i++)
              children[i].style.display = 'none';
          visible.style.display = 'block';
        };
		
		sel1 = new eulerface.Select(document.getElementById('sel1')),
		
        sel1.container.addEventListener('change', updateProblem);
		
		for (var k = 1; k <= problems.length; k++) {
			sel1.addOption(document.getElementById('opt-la-' + k), 'la-' + k);
		}
        
		blockPointSelect();
		
        MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
}());