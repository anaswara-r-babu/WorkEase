var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const dotenv = require('dotenv');
const session = require('express-session');
const flash = require("connect-flash");

dotenv.config();

const PORT = process.env.PORT;

var app = express();

const SESSION_KEY = process.env.SESSION_KEY;

app.use(session({
  secret: SESSION_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {secure: false}
}))

// Set up flash middleware (after session)
app.use(flash());

// Middleware to pass flash messages to all views
app.use((req, res, next) => {
  res.locals.message = req.flash("message");
  next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))

module.exports = app;
