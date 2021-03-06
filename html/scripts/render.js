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

			this.warningbox_group = this.svg.append("g");
			this.warningbox = this.warningbox_group.append("rect");
			this.warningbox_text = this.warningbox_group.append("text");

			this.config = new ConfigManager({
				graph: {
					width: 800,
					height: 600,
				},
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
		}

		fittoscreen(){
			var config = this.config;

			let totalwidth = this.container.node().offsetWidth;
			let totalheight = this.container.node().offsetHeight;

			if(!totalwidth || !totalheight)
				return;

			let graphwidth = totalwidth - config.margin.left - config.margin.right;
			let graphheight = totalheight - config.margin.top - config.margin.bottom;

			this.applyconfig({
				graph: {
					width: graphwidth,
					height: graphheight,
				},
			});

			this.renderinfo();
		}

		renderinfo(){
			var config = this.config;

			let graphwidth = this.config.graph.width;
			let graphheight = this.config.graph.height;

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
			.attr("dy", "-3em")
			.attr('text-anchor', 'middle')
			.attr('transform', `rotate(-90)`)
			.style('font-size', "1em")
			.text('Voltage');

			this.yAxis.attr("transform", `translate(${yAxis_group_x}, ${yAxis_group_y})`);

			let graph_x = config.margin.left;
			let graph_y = config.margin.top;
			this.pointbox.attr("transform", `translate(${graph_x}, ${graph_y})`);

			let warningbox_x = config.margin.left + config.graph.width * 3 / 4;
			let warningbox_y = 0;
			let warningbox_width = config.graph.width / 4 + config.margin.right;
			let warningbox_height = config.margin.top;
			this.warningbox_group.attr(
				"transform", `translate(${warningbox_x}, ${warningbox_y})`
			);
			this.warningbox
				.attr("width", warningbox_width)
				.attr("height", warningbox_height)
				.style("fill", "none");
			this.warningbox_text
				.attr("x", warningbox_width / 2)
				.attr("y", warningbox_height / 2)
				.attr("text-anchor", "middle")
				.attr("dominant-baseline", "middle")
				.style("font-size", "3em")
				.style("fill", "none")
				.text("warning");
		}

		setwarning(on_or_off){
			var warningbox_color, text_color;
			if(on_or_off){
				// on
				warningbox_color = "red";
				text_color = "blue";
			} else {
				// off
				warningbox_color = text_color = "none";
			}

			this.warningbox.style("fill", warningbox_color);
			this.warningbox_text.style("fill", text_color);
		}

		render(dataset){
			var config = this.config;

			let xEnd = d3.max(dataset, d => d.time);
			let xStart = xEnd - this.config.display.timeinterval;
			let xScale = d3.scaleLinear().domain([xStart, xEnd]).range([0, config.graph.width]);

			let yLower = d3.min(dataset, d=>d.voltage);
			let yUpper = d3.max(dataset, d=>d.voltage);
			let yScale = d3.scaleLinear().domain([yLower, yUpper]).range([config.graph.height, 0]);
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

			this.output_device.applyconfig({
				display: {
					timeinterval: this.config.data.keepinterval,
				},
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
			var dataset = this.dataset;

			if(dataset.length > 0){
				dataset.sort((l, r) => d3.ascending(l.time, r.time));

				let xStart = d3.max(dataset, d => d.time) - this.config.data.keepinterval;

				let k = 0;
				while(k < dataset.length && dataset[k].time < xStart)
					k++;

				dataset.splice(0, k);
			}
		}

		clear(){
			this.dataset.splice(0, this.dataset.length);

		}

		render(){
			graph.render(this.dataset);
		}

	}

	class WarningManager{
		constructor(output_device){
			this.warning_on = false;
			this.output_device = output_device;
			this.config = new ConfigManager({
				data: {
					toggleInterval: 300,
				},
			});

//			this.eventId = setInterval(this.togglewarning.bind(this), this.config.data.toggleInterval);
			this.eventId = null;
			this.until = 0;
		}

		setstate(on_or_off){
			this.warning_on = !!on_or_off;
			this.output_device.setwarning(this.warning_on);
		}

		clear(){
			this.setstate(false);
			clearInterval(this.eventId);
			this.eventId = null;
		}

		togglewarning(){
			if(Date.now() < this.until){
				this.setstate(!this.warning_on);
			} else {
				this.clear();
			}
		}

		triggerwarning(duration){
			var until = Date.now() + duration;
			if(this.until < until){
				this.until = until;
				
				if(!this.eventId){
					this.togglewarning();
					this.eventId = setInterval(this.togglewarning.bind(this), this.config.data.toggleInterval);
				}
			}
		}
	}

	function unpackBE(S){
		var V = 0;
		for(let x of S){
			V = V * 0x100 + x;
		}
		return V;
	}

	function on_connect(rc){
		if(rc.returnCode === 0)
			report(`[info] Successfully connected`);
	}

	var timecnt = 0;
	function unpack_packet(packet){
		var format = 1;
		if(format === 1){
			if(packet.length % 16 > 0){
				throw new RangeError("received invalid message format" + packet.toString());
			}

			for(let off=0;off<packet.length;off+=16){
				var packet_piece = packet.subarray(off, off+16);

				var time = unpackBE(packet_piece.subarray(0, 8));
				var voltage = unpackBE(packet_piece.subarray(8, 16));
			
				datamanager.addpoint(time, voltage);
			}
		} else if(format === 2){
			/*
			 * |<-  8 ->|<-  8 ->|<-    8   ->|<-    8   ->|
			 * --------------------------------------------------
			 * |   ??   | length | voltage[0] | voltage[1] | ...
			 * --------------------------------------------------
			 * */
			var length = unpackBE(packet.subarray(8, 16));
			for(let k=0;k<length;++k){
				if(packet.length < 24+8*k){
					report(`[error] packet length out of bounds`);
					console.log(JSON.stringify(packet.toString("hex")));
					break;
				}
				else
					datamanager.addpoint(
						timecnt+=30, 
						unpackBE(
							packet.subarray(16 + 8 * k, 24 + 8 * k)
						)
					);
			}

		}
	}

	function unpack_packet_by_promise(packet, resolve, reject){
		unpack_packet(packet);
		resolve();
	}

	function unpack_packet_async(packet){
		new Promise(
			unpack_packet_by_promise.bind(null, packet)
		).catch(report_error);
	}

//	var alerttopic = "elapsed";
	function on_message(recvtopic, payload){
		switch(recvtopic){
			case this.options.alerttopic:
				warningmanager.triggerwarning(5000);
				break;

			case this.options.topic:
				unpack_packet_async(payload);
				break;

			default:
				report(`[error] unknown topic ${JSON.stringify(recvtopic)} message receved`);
				break;
		}
//		if(recvtopic === alerttopic){
//			warningmanager.triggerwarning(5000);
//		} else {
//			unpack_packet_async(payload);
////			for(let offset=0; offset<payload.length; offset+= 16){
////				unpack_packet_async(payload.subarray(offset, offset+16));
////			}
//		}
	}

	function on_error(err){
		report(`[error] ${err.toString()}`);
	}

	function on_close(){
		report("[info] client disconnected");
	}

	function ECGReceiver(datamanager, mqttconfig){
		var client  = mqtt.connect(mqttconfig.url, mqttconfig);

		client.subscribe([mqttconfig.topic, mqttconfig.alerttopic]);

		client.on("message", on_message.bind(client));

		client.on("connect", on_connect);
		client.on("error", on_error);
		client.on("close", on_close);

		return client;
	};


	var inputentries = [{
		type: "text",
		id: "mqtturl", 
		display: "MQTT URL",
		default: "ws://147.46.244.130:9001/",
	},{
		type: "text",
		id: "clientid", 
		display: "Client ID",
	},{
		type: "text",
		id: "username", 
		display: "Username",
		default: "demo",
	},{
		type: "password",
		id: "password", 
		display: "Password",
		default: "guest",
	},{
		type: "text",
		id: "topic", 
		display: "Topic",
		default: "hello",
	},{
		type: "text",
		id: "alerttopic",
		display: "Alert Topic",
		default: "elapsed",
	}];

	var graph = new Render("#graph");
	var datamanager = new DataManager(graph);
	var warningmanager = new WarningManager(graph);

	var mqttrecv = null;

	function connect(){
		mqttconfig = {}

		{
			let urlelement = document.getElementById("mqtturl");
			if(urlelement.value){
				mqttconfig.url = urlelement.value;
			} else{
				report("[error] url must be specified");
				return;
			}
		}
		{
			let clientId = document.getElementById("clientid").value;
			if(clientId)
				mqttconfig.clientId = clientId;
		}
		{
			let username = document.getElementById("username").value;
			if(username){
				mqttconfig.username = username;
				let password = document.getElementById("password").value;
				if(password)
					mqttconfig.password = password;
			}
		}
		{
			let topicelement = document.getElementById("topic");
			if(topicelement.value)
				mqttconfig.topic = topicelement.value;
			else{
				report("[error] topic must be specified");
				return;
			}

		}
		{
			let alerttopicelement = document.getElementById("alerttopic");
			if(alerttopicelement.value)
				mqttconfig.alerttopic = alerttopicelement.value;
		}

		if(mqttrecv) disconnect();
		mqttrecv = ECGReceiver(datamanager, mqttconfig);
		view_wss_https(mqttconfig.url);
	}

	function disconnect(){
		if(mqttrecv){
			mqttrecv.end();
			mqttrecv = null;
		}
	}

	function refresh(){
		refreshinfo();
		refreshdatapoint();
	}

	function refreshinfo(){
		graph.fittoscreen();
		graph.renderinfo();
	}

	function refreshdatapoint(){
		datamanager.cleanup(); datamanager.render();
	}

	function viewdata(){ datamanager.cleanup(); datamanager.render();  }

	setInterval(viewdata, 30);

	var control = d3.select("#control");
	var control_table = control.append("table")
				.style("margin", "5px");

	control_table.append("thead")
		.append("tr")
		.append("td")
		.attr("colspan", 2)
		.html("MQTT Parameter Input");

	control_table.append("tbody")
		.selectAll("tr")
		.data(inputentries)
		.join(
			function(enter){
				var wrap = enter.append("tr");

				wrap.append("td")
					.append("label")
					.attr("for", d => d.id)
					.html(d => d.display + ":");

				return wrap.append("td").append("input")
			},
			update => update,
			exit => exit.remove()
		)
		.attr("type", d => d.type)
		.attr("id", d => d.id)
		.attr("name", d => d.id)
		.property("value", d => d.default);
	
	control.append("button")
		.html("connect")
		.on("click", connect);

	control.append("button")
		.html("disconnect")
		.on("click", disconnect);

	control.append("button")
		.html("fix graph size")
		.on("click", refresh);

	var click_on_error = control.append("a")
		.style("text-align", "center")
		.attr("target", "_blank")
		.html("click on error");
	
	var logarea = control.append("textarea")
		.attr("id", "log")
		.attr("cols", "100%")
		.attr("disabled", true)
		.style("flex-grow", 1)
		.style("flex-shrink", 1)
		.style("flex-basis", "auto");
	
	function report(msg){
		var logmsg = `[${Date.now()}]${msg}`;
		var appendedmsg = logarea.property("value") + logmsg + '\n';
		logarea.property("value", appendedmsg);
	}

	function report_error(msg){
		report(`[error] ${msg}`);
	}

	function view_wss_https(url){
		var urlobj = new URL(url);
		urlobj.protocol = "https:";
		var urlhttps = urlobj.toString();
		click_on_error.attr("href", urlhttps);
	}

	document.addEventListener("DOMContentLoaded", function(){

		var defaulturl = document.getElementById("mqtturl").value;
		if(defaulturl)
			view_wss_https(defaulturl);
		refresh();
	});

//			}();
