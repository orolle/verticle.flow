# Changelog

## 0.0.6:
* Allow login using the Github auth token
* Allow building repository-backed applications

## 0.0.5:
**Breaking change**: ```phonegap-build``` is now a *multi-task*, that supports multiple configurations.
This requires a change in the ```Gruntfile.js``` from:

    'phonegap-build':{
      options:{
        archive:'app.zip',
        'appId':'1234',
        'user':{
          'email':'a@example.org',
          'password':'abc123'
        }
      }
    }
to:

    'phonegap-build':{
      debug: {
        options:{
          archive:'app.zip',
          'appId':'1234',
          'user':{
            'email':'a@example.org',
            'password':'abc123'
          }
        }
      },
      release: {
        options:{
          archive:'app.zip',
          'appId':'9876',
          'user':{
            'email':'app@example.org',
            'password':'secretStuff'
          }
        }
      },
    }
