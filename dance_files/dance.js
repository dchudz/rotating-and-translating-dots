//vector operations:
var v = {
  	zero : {x : 0, y : 0},
		add : function(point1, point2) {return {x: point1.x + point2.x, y : point1.y + point2.y};},
		scale : function(point, factor) {return {x: point.x * factor, y : point.y * factor};},
		diff : function(point1, point2) {return v.add(point1, v.scale(point2, -1));},
		norm : function(point) {return Math.pow(Math.pow(point.x,2) + Math.pow(point.y,2), .5); },
		dot : function(v1,v2) {return v1.x*v2.x + v1.y*v2.y;},
		sign : function(number) {return number && number / Math.abs(number);},
		get_angle : function(v1, v2) {
			var unsigned_angle = Math.acos(Math.min(v.dot(v1,v2)/(v.norm(v1)*v.norm(v2)),1));
			var sign = v.sign(v1.x*v2.y - v1.y*v2.x);
			console.log(unsigned_angle);
			console.log(sign);
			return unsigned_angle*sign; 
			},
		make_rotation_matrix : function(angle) {return {a : Math.cos(angle), b : -Math.sin(angle), c : Math.sin(angle), d : Math.cos(angle)};},
		multiply : function(M, vector) {
			console.log("a" + M.a);
			console.log("b" + M.b);
			
  			var Mx = M.a*vector.x + M.b*vector.y;
  			var My = M.c*vector.x + M.d*vector.y;
  			console.log(Mx);
  			return {x : Mx, y : My};
			}

	};

function Dots($scope) {
	$scope.motion_type = 'rotate_and_scale'
	var r = 6;
	var margin = {top: 20, right: 20, bottom: 20, left: 20},
    width = 1000 - margin.left - margin.right,
    height = 1000 - margin.top - margin.bottom;

	var svg = d3.select("body").append("svg")
		.attr("width", width)
		.attr("height", height)

	var dots = svg.selectAll(".dot")

	var rect = svg.append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height)
 
	rect.on("click", mouseclick);

	var drag = d3.behavior.drag()
    .origin(Object.pos)
    .on("drag", dragmove);

    drag.on("dragend", function() {
		d3.selectAll(".dot").datum(function(d) {d.previous_pos = d.pos; return d;});    	
    });

    function mouseclick() {
   		x = d3.mouse(this)[0]
		y = d3.mouse(this)[1]
    	point = {x:x, y:y};
		dots.data([{pos : point, previous_pos : point}])
			.enter().append("circle")
			.attr("class", "dot")
			.attr("cx", function(d) { return d.pos.x; })
			.attr("cy", function(d) { return d.pos.y; })
			.attr("r", r)
			.call(drag);

	}

	function dragmove(d) {
		var old_point = d3.select(this).data()[0].previous_pos;
		var new_point = {x : d3.event.x, y : d3.event.y };
		d3.selectAll(".dot")
			.datum( function(d) {d.pos = eval($scope.motion_type)(old_point,new_point)(d.previous_pos); return d;})
	 	 	.attr("cx", function(d) {return d.pos.x;})
	 	 	.attr("cy", function(d) {return d.pos.y;})
	}


	function find_center(selection) {
		sum_of_all = selection.data().map(function(d) {return d.previous_pos;}).reduce(v.add, v.zero);
		return v.scale(sum_of_all, 1/selection.data().length);
	}

	function translate(old_point, new_point) {
		var translation = v.diff(new_point, old_point)
		return function(p) {
			return v.add(p, translation);};
	}

	function scale_only(old_point, new_point) {
		var center = find_center(d3.selectAll(".dot"));
		var old_vector = v.diff(old_point, center);
		var new_vector = v.diff(new_point, center);
		var scaling_factor = v.norm(new_vector) / v.norm(old_vector); //* v.sign(v.dot(old_vector, new_vector))
		if(v.norm(old_vector) == 0) scaling_factor = 0;
		return function(p) {
			var p_old_vector = v.diff(p, center);
			var p_new_vector = v.scale(p_old_vector, scaling_factor);
			return v.add(center, p_new_vector);
		}
	}

	function rotate_only(old_point, new_point) {
		var center = find_center(d3.selectAll(".dot"));
		var old_vector = v.diff(old_point, center);
		var new_vector = v.diff(new_point, center);
		var angle = v.get_angle(old_vector, new_vector);
		console.log(angle);
		var rotation_matrix = v.make_rotation_matrix(angle);
		return function(p) {
			var p_old_vector = v.diff(p, center);
			var p_new_vector = v.multiply(rotation_matrix, p_old_vector);
			return v.add(center, p_new_vector);
		}
	}

	function rotate_and_scale(old_point, new_point) {
		//return rotate_only(old_point, new_point);
		return function(p) {
			return scale_only(old_point, new_point)( rotate_only(old_point, new_point)(p) );
			//return rotate_only(old_point, new_point)(d);
		}
	}
}
