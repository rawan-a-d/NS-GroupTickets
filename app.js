							/* requiring node libraries */
let express = require('express');
let	app = express();
let	bodyParser = require('body-parser');
let	Sequelize = require('sequelize');
let	bcrypt = require('bcrypt');
let	db = new Sequelize(`postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@localhost/postgres`);
let	session = require('express-session');
let	nodemailer = require('nodemailer');
let	bunyan = require('bunyan');


app.set('views', __dirname + '/src/views');
app.set('view engine', 'pug');

app.use('/', bodyParser()); //creates key-value pairs request.body in app.post, e.g. request.body.username
app.use(express.static('src/public'));
app.use(session({
	secret: process.env.Session_secret, //change to SESSION_SECRET
	resave: true,
	saveUninitialized: false
}));

// Create a SMTP transporter object
let transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'groupticketsns@gmail.com',
        pass:  'ns87654321'
    },
    logger: bunyan.createLogger({
        name: 'nodemailer'
    }),
    debug: true // include SMTP traffic in the logs
}, {
    from: 'Ns Group-tickets <groupticketsns@gmail.com>',
    headers: {
        'X-Laziness-level': 1000 // just an example header, no need to use this
    }
});

								/* Creating the database */

// Create table user
var User = db.define( 'user',{
	name: {type: Sequelize.STRING, allowNull: false},
	email: {type: Sequelize.STRING, allowNull: false, unique: true},
	password: {type: Sequelize.STRING, allowNull: false}
});

// Create table comment
var Comment = db.define( 'comment', {
	text: {type: Sequelize.STRING, allowNull: false}
});

// Create table route
var Route = db.define( 'route', {
	from: {type: Sequelize.STRING, allowNull: false},
	to: {type: Sequelize.STRING, allowNull: false},
	covers: {type: Sequelize.STRING, allowNull: false}
});

// Create table day
var Day = db.define('day', {
	date: {type:Sequelize.DATEONLY, allowNull: false},
});

// Create table group
var Group = db.define('group', {
	link: {type: Sequelize.STRING, allowNull: false}
})

// Create table post
var Post = db.define( 'post', {
	content: {type: Sequelize.STRING, allowNull: false}
});


								/* Defining the relationships*/
User.hasMany(Comment);
Comment.belongsTo(User);

Route.belongsToMany(Day, {through: 'route_day'});
Day.belongsToMany(Route, {through: 'route_day'});

Comment.belongsTo(Route)
Route.hasMany(Comment)

Comment.belongsTo(Day)
Day.hasMany(Comment)

Group.belongsToMany(User, {through: 'group_user'})
User.belongsToMany(Group, {through: 'group_user'})

Post.belongsTo(Group)
Group.hasMany(Post)

Post.belongsTo(User);
User.hasMany(Post)

db.sync({force: true})
.then(()=> {
	var daysArr = [
		{date: '2017-07-06'},
		{date: '2017-07-07'},
		{date: '2017-07-08'},
		{date: '2017-07-09'},
		{date: '2017-07-10'},
		{date: '2017-07-11'},
		{date: '2017-07-12'},
		{date: '2017-07-13'},
		{date: '2017-07-14'},
		{date: '2017-07-15'}
	]
	Day.bulkCreate(daysArr)
})
.then( ()=> {
	Route.create({
		from: 'Vlissingen',
		to: 'Den Helder',
		covers: 'Alkmaar, Zaandam, Amsterdam Sloterdijk, Leiden C, Delft, Rotterdam C, Etten-Leur, Roosendaal and Bergen op zoom.'
	})
	.then((route)=>{
		Day.findAll()
		.then((day)=>{
			console.log('day')
			console.log(day)
			route.setDays(day)
		})
	})

	Route.create({
		from: 'Groningen',
		to: 'Maastricht',
		covers: 'Assen, Zwolle, Amersfoort, Utrecht C, Den Bosch, Eindhoven, Weert, Roermond and Sittard.'
	})
	.then((route)=>{
		Day.findAll({})
		.then((day)=>{
			console.log('day')
			console.log(day)
			route.setDays(day)
		})
	})

	Route.create({
		from: 'Den Helder',
		to: 'Maastricht',
		covers: 'Den Helder Zuid, Alkmaar Noord, Alkmaar, Zaandam ,Amsterdam Sloterdijk ,Amsterdam C ,Amsterdam Amstel ,Utrecht Centraal , Arnhem, Nijmegen and Venlo.'
	})
	.then((route)=>{
		Day.findAll()
		.then((day)=>{
			console.log('day')
			console.log(day)
			route.setDays(day)
		})
	})
});

											/* Home */
app.get('/', (req,res)=>{
	res.render('home')
});
                                            /* Register */

app.get('/register', (req,res) =>{ // Get the pug file and transform it to HTML and display it
	res.render('register')
});

app.post('/register', (req,res) =>{ // deal with the data that the client has sent and send a response
	User.findOne({ //look if a user already has an account
		where: {
			email: req.body.email
		}
	})
	.then((user) =>{
		if(user) { // if so show this message
			res.send('This email already exists'); //*** //use ajax
		}
		else if(req.body.password === req.body.password_conf && req.body.password.length !== 0 && req.body.password_conf.length !== 0){ //otherwise create an account
			bcrypt.hash(req.body.password, 9, (err, hash) =>{// store 'hash' into your database
				if(err){
					console.log(err);
				}
				else{
					User.create({
						name: req.body.name,
						email: req.body.email,
						password: hash
					})
					.then((user)=>{
						res.render('logIn',{message: 'Welcome '+ user.name });
					})
					.catch((err) =>{
						throw err;
					});
				}
			});
		}
	})
	.catch((err) =>{
		throw err;
	});
});


                                                   /* Login */

app.get('/logIn', (req,res) =>{
	res.render('LogIn');
});

app.post('/logIn', (req,res) =>{
	if(req.body.email.length === 0 || req.body.password.length === 0) {
		res.render('logIn' , {message: "Please fill in your email address and your password"});
		return;
	}

	User.findOne({ //look if the user's information matches the ones in the database
		where: {
			email: req.body.email
		}
	})
	.then((user) =>{
		if(user !== null){ // if user exists in the db
			var hash = user.password;
			bcrypt.compare(req.body.password, hash, (err, result) =>{// result === true
				console.log('reached');
				if(result === true){ // if the password is correct
					req.session.user = user; // start a session
					res.redirect('/');
				}
				else{ // otherwise do this
					res.render('logIn', {message:'Invalid email or password'});

				}
			});
		}
		else{
			res.render('logIn', {message: "You don't have an account."});
		}
	})
	.catch((err) =>{
		throw err;
	});
});

											/* Routes */
app.get('/routes', (req,res)=>{
	var user = req.session.user
	if(user){
		Route.findAll({
			include: [{model: Day}]
		})
		.then((routes)=>{
			console.log(routes);
			res.render('routes',{routes: routes});
		})
	}
	else{
		res.render('logIn', {message: 'Please Log in to view the page'});
	}
});

app.post('/routes', (req,res)=>{
	res.redirect('/view')
})

										/* View */
app.get('/view', (req,res)=>{
	var user = req.session.user
	if(user){
		let routeId = req.query.routeId
		let dayId = req.query.dayId
		Route.findOne({
			where : {
				id : routeId
			},
			include : [
				{ model: Day, where: {id: dayId}},
				{ model: Comment, include: [User]}
			]
		})
		.then((route)=>{		
			res.render('seePosts', {route:route})
		})
	}
	else{
		res.render('logIn', {message: 'Please Log in to view the page'});
	}
});


app.post('/view', (req,res) =>{
	console.log(req.session.user.id)
	let routeId = req.body.routeId
	let dayId = req.body.dayId
	Comment.create({ // add the comment to the database
		text : req.body.comment,
		userId : req.session.user.id,
		routeId: routeId,
		dayId: dayId
	})
	.then(()=>{
		Comment.findAll({
			where : {
				routeId: routeId,
				dayId: dayId


			},
			include: [User]
		})
		.then((comments)=>{
			if(comments.length === 3){ // It should be === 9 but for testing I made it 1
				Group.create({
					link: 'http://localhost:3000/group',
				})
				.then((group)=>{
					for (var i = 0; i < comments.length; i++){
						const user = comments[i].user
						group.addUser(user)
						let message = {
						    // Comma separated list of recipients
						    to: `${comments[i].user.name} <${comments[i].user.email}>`,
						    // Subject of the message
						    subject: 'Group tickets', //
						    // plaintext body
						    text: `Hello ${comments[i].user.name}`,
						    // HTML body
						    html: `<p><b>Your group</b> is full </p><a href=${group.link}?id=${group.id}>Here's the link</a>`
						}
						console.log('Sending Mail');
						transporter.sendMail(message, (error, info) => {
						    if (error) {
						        console.log('Error occurred');
						        console.log(error.message);
						        return;
						    }
						    console.log('Message sent successfully!');
						    console.log('Server responded with "%s"', info.response);
						    transporter.close();
						});
						Comment.destroy({where: {id: comments[i].id}})
					}
					Route.findOne({
						where : {
							id : routeId
						},
						include : [
							{ model: Day, where: {id: dayId}},
							{ model: Comment, include: [User]}
						]
					})
					.then((route)=>{
						console.log('route')							
						console.log(route)	
						res.render('seePosts', {route: route, message: 'An email has been sent to you with a link of the group'})
					})				
				})
			}
			else{	
				res.redirect('/view?dayId=' + dayId + '&routeId=' + routeId)
			}
		})
	})
})

app.get('/group', (req,res) =>{
	const groupId = req.query.id
	console.log("Group id from query pug" + groupId)
	Group.findOne({
		where: {
			id: groupId
		},
		include: [
			{model: User},
			{model: Post, include: [User]}
		]
	})
	.then((group)=>{
		res.render('group', {group: group, userId: req.session.user.id})		
	})
})

app.post('/group', (req,res) =>{
	const groupId = req.body.groupId
	Post.create({
		content: req.body.post,
		groupId: groupId,
		userId: req.body.userId
	})
	.then(()=>{
		res.redirect('/group?id=' + groupId)
	})
})

app.get('/info',(req,res) =>{
	var user = req.session.user
	if(user){
		res.render('info')
	}
	else{
		res.render('logIn', {message: 'Please Log in to view the page'});
	}
})

app.get('/admin',(req,res)=>{
	Route.findAll()
	.then((routes)=>{
		res.render('admin', {routes: routes})		
	})
})

app.post('/admin', (req,res)=>{
	Day.findOne({
		where: {
			date: req.body.date
		}
	})
	.then((day) =>{
		if(day){
			Route.findAll()
			.then((routes)=>{
				res.render('admin', {routes: routes, message: 'This date already exists'})		
			})
		}
		else{
			Day.create({
				date: req.body.date
			})
			.then((day)=>{
				Route.findAll({
					where: {
						id: req.body.routeId
					}
				})
				.then((route)=>{
					day.setRoutes(route)
				})
				.then(()=>{
					Route.findAll()
					.then((routes)=>{
						res.render('admin', {routes: routes, message: 'This date has been added'})		
					})
				})
			})
		}
	})
})

app.get('/contact', (req,res)=>{
	var user = req.session.user
	if(user){
		res.render('contact')
	}
	else{
		res.render('logIn', {message: 'Please Log in to view the page'});
	}
})

									/* Logout */
app.get('/logout', (req,res) =>{
	req.session.destroy((err) =>{ // destroy the session
		if(err){
			throw err
		}
		res.render('logIn',{message: 'Successfully logged out.'})
	})
})

									/* The server */
var listener = app.listen(3000, function () {
	console.log('The server is listening on port ' + listener.address().port);
});