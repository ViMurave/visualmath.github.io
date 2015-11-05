var problems = [
	{	id: 'la-1',
		eqn: 'x^2 + y^2 + z^2 = 1',
		eqn_comp: [
			//0 - Compute Radius
			function(phi, ksi) {
				return 1;
			},
			//1 - Compute x
			function(r, phi, ksi) {
				return r * Math.cos(phi) * Math.cos(ksi);
			},
			//2 - Compute y
			function(r, phi, ksi) {
				return r * Math.sin(phi) * Math.cos(ksi);
			},
			//3 - Compute z
			function(r, psi, ksi) {
				return r * Math.sin(ksi);
			}
		]
	}
];