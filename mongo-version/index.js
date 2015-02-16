var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var version = require('mongoose-version');
var dockerHost = require('docker-host')();
var Promise = require('bluebird');

// Schema.
var PageSchema = new Schema({
  title: {type: String, required: true},
  content: {type: String, required: true},
  path: {type: String, required: true},
  tags: [String],

  lastModified: Date,
  created: Date
});

// Add plugin.
PageSchema.plugin(version);

// Create model.
var Page = mongoose.model('Tank', PageSchema);

// Connect to mongo.
mongoose.connect('mongodb://' + dockerHost.host + '/test');

// Create page.
Promise.promisify(Page.create.bind(Page))({
  title: 'My title',
  content: 'My content',
  path: 'my path'
})
// Update page.
.then(function (page) {
  page.__v++;
  page.title = 'My new title';
  return Promise.promisify(page.save.bind(page))();
})
// Request versions.
.spread(function (page) {
  console.log('Page saved', page);
  return Promise.promisify(Page.VersionedModel.find.bind(Page.VersionedModel))({refId: page._id});
})
// List versions.
.then(function (versions) {
  console.log('Versions', versions);
});
