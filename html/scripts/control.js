
	var svgwrap = document.getElementById("graph");
	var graph = new Render("#graph");
	graph.fittoscreen(); graph.renderinfo();
	var datamanager = new DataManager(graph);
	var mqttrecv = ECGReceiver(datamanager, {
		url: "wss://147.46.244.130:9001/",
		clientId: "Browser0",
		username: "demo",
		password: "guest",
		topic: "hello",
	});

	function viewdata(){ datamanager.cleanup(); datamanager.render();  }

	setInterval(viewdata, 30);

	function MQTTInput(){
		var inputlisttag = (
			<div>
				<input type="text" defaultValue="aa"/>
				<input type="button" value="hh"/>
			</div>

		);
		return inputlisttag;
	}

	ReactDOM.render(
		<MQTTInput />,
		document.getElementById("control")
	);

			!function(){
//				var rootdiv = document.getElementById("root");

//				var count = 0;
//				var interval = 1000; // [ms]
//
//				function refresh(){
//					ReactDOM.render(
//						<h1>Hello, world! {count}</h1>,
//						rootdiv
//					);
//				};
//
//				function increment(){
//					count++;
//					refresh();
//					//console.log(`incremented count to ${count}`);
//				};
//
//				refresh();
//				setInterval(increment, interval);
//				var interval = 1000; // [ms]

				class SecondCounter extends React.Component{
					constructor(props){
						super(props);
						this.state = {
							count: 0,
							interval: 1000, // [ms]
						};
					}
					
					componentDidMount(){
						var tag = this;
						tag.state.timerid = setInterval(
							function(){
								tag.setState(
									{
										count: tag.state.count + 1,
									}
								);
							},
							tag.state.interval
						);
					}

					componentWillUnmount(){
						clearInterval(this.state.timerid);
					}

					render(){
						graph.fittoscreen(); graph.renderinfo(); viewdata();
						
						return (
							<h1>{this.state.count} seconds passed.</h1>
						);
					}
				}

//				ReactDOM.render(
//					<SecondCounter />,
//					rootdiv
//				);
			}();

	function ECGGraph(){
		const svgvparent = React.useRef(null);
		const [vdataset, vapplydata] = React.useState([]);

		React.useEffect(function(){
			var graph = new Render(svgvparent.current);
			graph.render();
		}, vdataset);

		return (
			<div ref={svgvparent}></div>
		);
	}

//	var graphparent = document.getElementById("graph");
//	ReactDOM.render(
//		<ECGGraph />,
//		graphparent
//	);
//
