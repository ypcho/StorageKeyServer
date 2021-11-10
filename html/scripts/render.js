//			!function(){
	

	class ConfigManager {
		constructor(defaultconfig){
			Object.assign(this, defaultconfig);
		}

		applyconfig(configmod){
			if(configmod){
				for(let component in configmod){
					if(!(component in this))
						this[component] = {};
					Object.assign(this[component], configmod[component]);
				}
			}
		}

	}

	class Render {
		constructor(element, config){
			var svgparent = d3.select(element);
			svgparent.selectAll("*").remove();

			this.container = svgparent;
			this.svg = svgparent.append("svg");

			this.svg.attr("width", "100%");
			this.svg.attr("height", "100%");

			// create elements
			this.title = this.svg.append("text");

			let xAxis_group = this.svg.append("g");
			this.xAxis_text = xAxis_group.append("text");
			this.xAxis = xAxis_group.append("g");

			let yAxis_group = this.svg.append("g");
			this.yAxis_text = yAxis_group.append('text');
			this.yAxis = yAxis_group.append("g");

			this.pointbox = this.svg.append("g");
			this.graphelement = this.pointbox.append("path")
					.attr("fill", "none")
					.attr("stroke", "red");

			this.config = new ConfigManager({
				margin: {
					left: 80,
					right: 80,
					top: 80,
					bottom: 80,
				},
				display: {
					timeinterval: 3000,
				}
			});

			this.applyconfig(config);
		}

		applyconfig(configmod){
			this.config.applyconfig(configmod);

			this.clear();
		}

		render(dataset){
			var config = this.config;;

			let totalwidth = this.container.node().offsetWidth;
			let totalheight = this.container.node().offsetHeight;

			if(!totalwidth || !totalheight)
				return;

			let graphwidth = totalwidth - config.margin.left - config.margin.right;
			let graphheight = totalheight - config.margin.top - config.margin.bottom;

			// Title
			this.title
			.attr('x', config.margin.left + graphwidth / 2)
			.attr('y', config.margin.top)
			.attr('dy', "-1em")
			.attr('text-anchor', 'middle')
			.style('font-size', "2em")
			.text('ECG Data Display');
			
			let xAxis_group_x = config.margin.left;
			let xAxis_group_y = config.margin.top + graphheight;

			this.xAxis_text
			.attr('x', xAxis_group_x + graphwidth / 2)
			.attr('y', xAxis_group_y)
			.attr('dy', "2em")
			.attr('text-anchor', 'middle')
			.style('font-size', "1em")
			.text('Time');

			this.xAxis.attr("transform", `translate(${xAxis_group_x},${xAxis_group_y})`);

			let yAxis_group_x = config.margin.left;
			let yAxis_group_y = config.margin.top;
			
			this.yAxis_text
			.attr("x", -(yAxis_group_y + graphheight / 2))
			.attr("y", yAxis_group_x)
			.attr("dy", "-1.5em")
			.attr('text-anchor', 'middle')
			.attr('transform', `rotate(-90)`)
			.style('font-size', "1em")
			.text('Voltage');

			this.yAxis.attr("transform", `translate(${yAxis_group_x}, ${yAxis_group_y})`);

			let graph_x = config.margin.left;
			let graph_y = config.margin.top;
			this.pointbox.attr("transform", `translate(${graph_x}, ${graph_y})`);
			let xEnd = d3.max(dataset, d => d.time);
			let xStart = xEnd - this.config.display.timeinterval;
			let xScale = d3.scaleLinear().domain([xStart, xEnd]).range([0, graphwidth]);

			let yLower = d3.min(dataset, d=>d.voltage);
			let yUpper = d3.max(dataset, d=>d.voltage);
			let yScale = d3.scaleLinear().domain([yLower, yUpper]).range([graphheight, 0]);
			{
				// Draw X Axis
				this.xAxis.call(d3.axisBottom(xScale));
			
				// Draw Y Axis
				this.yAxis.call(d3.axisLeft(yScale));
			}

			let drawline = d3.line()
					.x(d => xScale(d.time))
					.y(d => yScale(d.voltage));

			this.graphelement
			.attr('d', drawline(dataset));

                        this.pointbox.selectAll("circle")
                        .data(dataset, d => d.time)
                        .join(
                                enter => enter.append("circle").attr("r", 2).style("fill", "#CC0000"),
                                update => update,
                                exit => exit.remove()
                        )
                        .attr("cx", function (d) { return xScale(d.time); } )
                        .attr("cy", function (d) { return yScale(d.voltage); } );

		}

		clear(){
			this.render([]);
		}
	}

	class DataManager{
		constructor(output_device){
			this.dataset = [];
			this.output_device = output_device;
			this.config = new ConfigManager({
				data: {
					keepinterval: 3500,
					renderinterval: 30,
				}

			});
		}

		applyconfig(configmod){
			this.config.applyconfig(configmod);
		}

		add(dat){
			if(!dat.time || !dat.voltage){
				throw new TypeError("data must be of format {time, voltage}");
			}

			this.dataset.push(dat);
		}

		addpoint(time, voltage){
			this.dataset.push({time, voltage});
		}

		cleanup(){
			if(this.dataset.length > 0){
				this.dataset.sort((l, r) => d3.ascending(l.time, r.time));

				let xStart = d3.max(this.dataset, d => d.time) - this.config.data.keepinterval;

				let k = 0;
				while(k < dataset.length && dataset[k].time < xStart)
					k++;

				dataset.splice(0, k);
			}
		}

		render(){
			graph.render(this.dataset);
		}

	}

	var svgwrap = document.getElementById("graph");
	var graph = new Render("#graph");
	var datamanager = new DataManager(graph);

	class ECGbyMQTT {
		constructor(){
			this.config = new ConfigManager({
				mqtt: {

				},

			});

		}

	}
	{
		var dataset = [];

		var url = 'wss://147.46.244.130:9001';
		var client_id = "Browser0";
		var username = "demo";
		var password = "guest";
		var topic = "hello";
		var client  = mqtt.connect(url, {
			clientId: client_id,
			username: username,
			password: password,

			reconnectPeriod: 10000,
			destroy: function(){
				var urlobj = new URL(url);
				urlobj.protocol = "https:";
				open(urlobj.toString());
			},
		});

		let unpackBE = function(S){
			var V = 0;
			for(let x of S){
				V = V * 0x100 + x;
			}
			return V;
		};

		client.subscribe(topic);
		client.on("message", function(recvtopic, payload){
			if(payload.length !== 16){
				console.error("invalid payload format");
							return;
			}

						var time = unpackBE(payload.subarray(0, 8));
						var voltage = unpackBE(payload.subarray(8, 16));
						
						dataset.push({time, voltage});
		});
	}

//			}();
