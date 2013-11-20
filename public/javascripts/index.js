$(function() {

  Parse.$ = jQuery;

  // Initialize Parse with your Parse application javascript keys
  Parse.initialize("tVJk6XkzAnsuvPG4o2VUPBDGLzIOVEQTXJmSo5eK",
                   "jruy0SxHv9EVpYe1ieYposMdxnu5813MCkuM7Um5");

  var Video = Parse.Object.extend("Video", {
    defaults: { description: "N/A", }
  });

  var VideoList = Parse.Collection.extend({
    // Reference to this collection's model.
    model: Video,
  });

  var VideoView = Parse.View.extend({

    //... is a list tag.
    tagName:  "li",

    // Cache the template function for a single item.
    template: _.template($('#video-template').html()),

    // The DOM events specific to an item.
    events: {
    },

    initialize: function() {
      _.bindAll(this, 'render', 'remove');
      this.model.bind('change', this.render);
      this.model.bind('destroy', this.remove);
    },

    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    },

    // Remove the item, destroy the model.
    clear: function() {
      this.model.destroy();
    }

  });

  // The Application
  // ---------------

  var ManageVideosView = Parse.View.extend({

    statsTemplate: _.template($('#stats-template').html()),

    events: {
      "click .show-upload-modal": "showUploadModal",
      "click .log-out": "logOut"
    },

    el: ".content",

    initialize: function() {
      var self = this;

      _.bindAll(this, 'render', 'addOne', 'addAll', 'logOut');

      this.$el.html(_.template($("#manage-videos-template").html()));

      this.videos = new VideoList;

      this.videos.query = new Parse.Query(Video);
      if (Parse.User.current().get('username') != 'admin') {
        this.videos.query.equalTo("user", Parse.User.current());
      }

      this.videos.bind('add',     this.addOne);
      this.videos.bind('reset',   this.addAll);
      this.videos.bind('all',     this.render);

      this.videos.fetch();
    },

    addOne: function(video) {
      var view = new VideoView({model: video});
      this.$("#video-list").append(view.render().el);
    },

    addAll: function(collection, filter) {
      this.$("#video-list").html("");
      this.videos.each(this.addOne);
    },

    // Logs out the user and shows the login view
    logOut: function(e) {
      Parse.User.logOut();
      new LogInView();
      this.undelegateEvents();
      delete this;
    },

    showUploadModal: function(e) {
      var self = this;

      self.videos.create({
        youtube_id: 'iTxNSkrKgmI',
        description: 'desc',
        user:    Parse.User.current()
      });
    },

    render: function() {
      this.$('#videos-stats').html(this.statsTemplate({
        total: this.videos.length
      }));

      this.delegateEvents();
    },
  });

  var LogInView = Parse.View.extend({
    events: {
      "submit form.login-form": "logIn",
      "submit form.signup-form": "signUp"
    },

    el: ".content",

    initialize: function() {
      _.bindAll(this, "logIn", "signUp");
      this.render();
    },

    logIn: function(e) {
      var self = this;
      var username = this.$("#login-username").val();
      var password = this.$("#login-password").val();

      Parse.User.logIn(username, password, {
        success: function(user) {
          new ManageVideosView();
          self.undelegateEvents();
          delete self;
        },

        error: function(user, error) {
          self.$(".login-form .error").html("Invalid username or password. Please try again.").show();
          self.$(".login-form button").removeAttr("disabled");
        }
      });

      this.$(".login-form button").attr("disabled", "disabled");

      return false;
    },

    signUp: function(e) {
      var self = this;
      var username = this.$("#signup-username").val();
      var password = this.$("#signup-password").val();

      Parse.User.signUp(username, password, { ACL: new Parse.ACL() }, {
        success: function(user) {
          new ManageVideosView();
          self.undelegateEvents();
          delete self;
        },

        error: function(user, error) {
          self.$(".signup-form .error").html(error.message).show();
          self.$(".signup-form button").removeAttr("disabled");
        }
      });

      this.$(".signup-form button").attr("disabled", "disabled");

      return false;
    },

    render: function() {
      this.$el.html(_.template($("#login-template").html()));
      this.delegateEvents();
    }
  });

  var AppView = Parse.View.extend({
    el: $("#videoapp"),

    initialize: function() {
      this.render();
    },

    render: function() {
      if (Parse.User.current()) {
        new ManageVideosView();
      } else {
        new LogInView();
      }
    }
  });

  var AppRouter = Parse.Router.extend({
    routes: {
      "all": "all"
    },

    initialize: function(options) {
    },

    all: function() {
    }
  });

  new AppRouter;
  new AppView;
  Parse.history.start();
});

