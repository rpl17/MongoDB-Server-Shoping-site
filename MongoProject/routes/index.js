var faker = require('faker');

module.exports = function(app, mongodb) {
	
	var next_id = 0;
	
	app.get('/', function(request, response) {
		sessionData = request.session;
		if (sessionData.user == null) {
			sessionData.user = {};
			sessionData.user.id = next_id++;
			sessionData.user.cart = [];
			sessionData.user.pastorders = [];

		}
		
	    response.render('login_register');
	});
	//app.post('
	usernames = ["Ryan", "Chirs", "Petter", "Jack"];
	app.post('/home', function(request, response) {
		var registername = request.body.register_name;
		if (usernames.includes(registername) == true)
		{
		response.render('name_unavailable');
		}
		else{
		console.log("Welcome, "+registername+"!");
		usernames.push(registername);
		response.render('shop_index');
		}
	});
	app.post('/login', function(request, response) {
		var loginname = request.body.login_name;	
		if (usernames.includes(loginname) == true)
		{
			response.render('shop_index');
			console.log("Successfully logged in as, "+loginname);
		}
		if (usernames.includes(loginname) == false)
		{
		response.render('create_user');
		}		
	});
	app.post('/past_orders', function(request, response) {
	var db = mongodb.db('shopDB');
	if (db == null) {console.log("Unable to connect to the database"); return; }
	console.log("Connected");
	var cursor = db.collection('products').find();
	products = [];
	cursor.forEach(function(item) {
	if (item != null) { 
	products.push(item);
	}
	}, function(err) { 
	response.render('past_orders', products); 
	});
	});
	app.post('/login_home', function(request, response) {
		 console.log("To access the shop please login or register succesfully.");
		 response.render('login_register');
	});
	app.post('/mainmenu', function(request, response) {
		 response.render('shop_index');
	});
	app.post('/checkout', function(request, response) {
		var db = mongodb.db('shopDB');
		if (db == null) {console.log("Unable to connect to the database"); return; }

		console.log("Looking in cart");
		productIds = [];
		if (sessionData.user) {
			var totalItems = sessionData.user.cart.length;
			var foundIt = false;
			var i;
			for (let i = 0; i < totalItems; i++) {
				var item = sessionData.user.cart[i];
				productIds.push(item.productId);
				console.log(item);
			}			
		}
		var requestedProductID = request.body.productId;
		requestedProductID = parseInt(requestedProductID);
				
		sessionData = request.session;
	  
		console.log("Fetching product information");
		var cursor = db.collection('products').find( { productId : { $in : productIds } } );
		errorProducts = [];
		products = [];
		cursor.forEach(function(item) {			
		  if (item != null) {	
			//Adjust the quantity by the amount in the cart
			var keepProduct = true;
			if (sessionData.user) {
				var totalItems = sessionData.user.cart.length;
				var i;
				for (let i = 0; i < totalItems; i++) {
					var itemInCart = sessionData.user.cart[i];
					if (itemInCart.productId === item.productId) {
						item.quantity = item.quantity - itemInCart.quantity
						
						var name = item.name
						
						console.log("Checking inventory on:" + item.productId);
						console.log("name:" + item.name);
						console.log("quantity:" + item.quantity);
						
						//There is not enough quantity of this item in the store.
						if (item.quantity < 0) {
							//There is not enough of this item
							itemInCart.quantity = item.quantity;
							errorProducts.push(name);
							console.log("Not enough quantity");
						}
						
						if (itemInCart.quantity < 1) {
							//Need to remove from the cart all together
							sessionData.user.cart.splice(i, 1); 
							keepProduct = false;
							console.log("Removing..");
						}
						break;
					}
				}			
			}
		  
			if (keepProduct) {
				products.push(item);
			}
		  }
		}, function(err) {
			if (err) {
				messages = [];
				var msg = "Something bad happened";
				messages.push({"txt":msg});
				response.render('shop_message', messages);
			}
			else {
				console.log("Attempting to checkout....");
				if (errorProducts.length > 0) {
					console.log("We had errors:" + errorProducts);
					//We already have the product list.. in products array
					var totalItems = products.length;
					var i;
					for (let i = 0; i < totalItems; i++) {
						var product = products[i];
						
						//Now confirm with quantity in inv.						
						var invItems = sessionData.user.cart.length;
						var j;
						for (let j = 0; j < invItems; j++) {
							var itemInCart = sessionData.user.cart[j];
							if (itemInCart.productId === product.productId) {								
								product.quantity = itemInCart.quantity
								console.log(itemInCart);
								break;
							}
						}							
					}
					console.log("Errors in:" + errorProducts);
					response.render('user_cart', {products:products, errorMessages: errorProducts});
				}
				else {
					//iterate each item in products array from just above
					var totalItems = products.length;
					var i;
					for (let i = 0; i < totalItems; i++) {
						var product = products[i];
						
						var query = {productId: product.productId};
						var newvalues = { $set: {quantity: product.quantity} };
						db.collection("products").updateOne( query, newvalues, function(err, res) {
						});
					}		
								
					//Update cart data	
					sessionData = request.session;
					sessionData.user.cart = [];
					sessionData.user.pastorders = [];					
					messages = [];
					var msg = "Updated quantities in store, enjoy your purchases!";
					messages.push({"txt":msg});
					response.render('shop_message', messages);
				}							
			}
		  }
		);
		
	});
	
	
	app.post('/show_cart', function(request, response) {
		var db = mongodb.db('shopDB');
		if (db == null) {console.log("Unable to connect to the database"); return; }

		console.log("Looking in cart");
		productIds = [];
		if (sessionData.user) {
			var totalItems = sessionData.user.cart.length;
			var foundIt = false;
			var i;
			for (let i = 0; i < totalItems; i++) {
				var item = sessionData.user.cart[i];
				productIds.push(item.productId);
				console.log(item);
			}			
		}
		
		console.log("Fetching product information");
		var cursor = db.collection('products').find( { productId : { $in : productIds } } );
		products = [];
		cursor.forEach(function(item) {
		  if (item != null) {	

			//adjust the quantity to that of the CART
			if (sessionData.user) {
				var totalItems = sessionData.user.cart.length;
				var i;
				for (let i = 0; i < totalItems; i++) {
					var itemInCart = sessionData.user.cart[i];
					if (itemInCart.productId === item.productId) {
						item.quantity = itemInCart.quantity
						break;
					}
				}			
			}
		  
			products.push(item);
		  }
		}, function(err) {
			response.render('user_cart', {products:products, errorMessages: []});
		  }
		);
		
	});
		
	app.post('/remove_from_cart', function(request, response) {		
		var requestedProductID = request.body.productId;
		requestedProductID = parseInt(requestedProductID);
				
		sessionData = request.session;
		
		messages = [];
		
		var totalItems = sessionData.user.cart.length;
		var foundIt = false;
		var i;
		console.log("Examining cart for item to remove:" + requestedProductID);
		for (let i = 0; i < totalItems; i++) {
			
			var item = sessionData.user.cart[i];
			console.log(item);
			if (item.productId === requestedProductID) {
				item.quantity = item.quantity - 1;				
				foundIt = true;
				if (item.quantity == 0) {
					//Remove this from the list!
					sessionData.user.cart.splice(i, 1); 
				}
				var msg = "Updated cart";
				messages.push({"txt":msg});
				break;
			}
			else {
				console.log("Does not match");
			}
		}
		
		if (!foundIt) {
			var msg = "Was unable to find object in cart:";		
			messages.push({"txt":msg});
		}
	  		
		response.render('shop_message', messages);
		return; 
	});
	
	app.post('/add_to_cart', function(request, response) {		
		var requestedProductID = request.body.productId;
		requestedProductID = parseInt(requestedProductID);
				
		sessionData = request.session;
		
		var totalItems = sessionData.user.cart.length;
		var foundIt = false;
		var i;
		for (let i = 0; i < totalItems; i++) {
			
			var item = sessionData.user.cart[i];
			if (item.productId === requestedProductID) {
				item.quantity = item.quantity + 1;
				
				foundIt = true;
				break;
			}
		}
		
		if (!foundIt) {
			var productObj = {};
			productObj.productId = requestedProductID;
			productObj.quantity = 1;		
			sessionData.user.cart.push(productObj);
		}
	  
		var msg = "Request to add to cart product id:" + requestedProductID;
		messages = [];
		messages.push({"txt":msg});
		response.render('shop_message', messages);
		return; 
	});
	
	app.post('/generate_fakedata', function(request, response) {
		messages = [];
		var db = mongodb.db('shopDB');
		if (db == null) 
		{
			console.log("Unable to connect to the database");
			messages.push({"txt":"Unable to connect to the database."});
			response.render('shop_message', messages);
			return; 
		}
		
		var totalItems = 0;
		var i;
		for (let i = 0; i < 20; i++) {
			var product = {
				productId : i,
				name : faker.commerce.productName(),
				price : faker.commerce.price(),
				quantity: 1 + Math.floor(Math.random() * 10),
				description : faker.lorem.paragraph(),
				orderid : faker.datatype.uuid(),
				date : faker.date.recent(),
				image: faker.image.image()
			};
			
			var query = {productId: i};
			var options = { upsert: true };
			db.collection("products").replaceOne( query, product, options, function(err, res) {
				if (err) throw err;
				console.log("1 product inserted");
			});
		}
		
		messages.push({"txt":"Sample product data has been generated."});
		response.render('shop_message', messages);
	});
	
	app.post('/show_catalog', function(request, response) {
		var db = mongodb.db('shopDB');
		if (db == null) {console.log("Unable to connect to the database"); return; }

		var cursor = db.collection('products').find();
		products = [];
		cursor.forEach(function(item) {
		  if (item != null) {		  
			products.push(item);
		  }
		}, function(err) {
			response.render('shop_products', products);
		  }
		);
		
	});


	return app;
}