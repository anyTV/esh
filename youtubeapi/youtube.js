var GoogleResource = function() {
    var provider, config, token;
    __contruct = function(that) {
        that.config = {"interactive" : true};
        that.provider = chrome.identity;
    }(this);
}

GoogleResource.prototype.hasAccessToken= function() {
    if(this.token)
        return true;
    return false;
}
GoogleResource.prototype.getAccessToken = function() {
    return this.token;
}
GoogleResource.prototype.clearAccessToken = function(callback) {
    var that = this
        , req = new XMLHttpRequest();

    this.provider.getAuthToken(this.config, function(token) {
        req.open('GET', "https://accounts.google.com/o/oauth2/revoke?token=" + token);
        req.onload = function() {
            if (req.status === 200 ) {
                that.provider.removeCachedAuthToken({"token" : token}, function() {
                    if(chrome.runtime.lastError) {
                        callback(chrome.runtime.lastError);
                        return;
                    }
                    that.token = null;
                    callback(null);
                    return;
                });
            }
            else {
                callback({"message" : req.statusText});
                return;
            }
        };
        req.onerror = function() {
            callback({"message" : "Error Occured"});
            return;
        }
        req.send();
    });
}

GoogleResource.prototype.authorize=function(callback) {
    var that = this;
    this.provider.getAuthToken(this.config, function(token) {
        if(chrome.runtime.lastError) {
            callback(chrome.runtime.lastError);
            return;
        }
        if(!token) {
            callback(null, null);
            return;
        }
        that.token = token;
        callback(null, token);
        return;
    });
}
GoogleResource.prototype.isAccessTokenExpired = function() {
    this.provider.isAccessTokenExpired();
}


var YoutubeResource = function(config) {
    this.key = "AIzaSyBFAShlZr9tBGQBjtyN_IY9-SbVVn-fMcc"; //REPLACE THE KEY WITH YOUR KEY
    var queryType = "https://www.googleapis.com/youtube/v3/channels";  // default query type
    
    if(config.type=='listPlaylistItems')
        queryType = 'https://www.googleapis.com/youtube/v3/playlistItems';
    else if(config.type =="listVideos")
        queryType = 'https://www.googleapis.com/youtube/v3/videos';
    else if(config.type =="getPeople")
        queryType='https://www.googleapis.com/plus/v1/people/me';
    
    this.type = queryType;
}


YoutubeResource.prototype.queryURL = function(params,filter, optParams) {
    
    var filterStr = JSON.stringify(filter);
    filterStr = filterStr.replace(/\{|\}|\"|/g,"");
    filterStr = filterStr.replace(/:/g,"=");
    return (this.type +"?" +
      'part={{PARAMS}}&' +
      '{{FILTER}}&'+
      '{{OPTPARAMS}}&' +
      'key={{CODE}}')
        .replace('{{PARAMS}}', encodeURIComponent(params))
        .replace('{{FILTER}}',filterStr)
        .replace('{{OPTPARAMS}}', makeValid(optParams))
        .replace('{{CODE}}', this.key);
}

function makeValid(optParams) {
    // console.log(optParams);
    var fields = optParams.fields;
    // console.log(fields);
    
    if(optParams["fields"] != undefined)
        delete optParams["fields"];
    
    var strData = JSON.stringify(optParams);
    // console.log(optParams +" = "+strData);
    var valid = strData.replace(/\{|\}/g,"");
    // valid = valid.replace(/}/g,"");
    valid = valid.replace(/"/g,'');
    valid = valid.replace(/:/g,"=");
    valid = valid.replace(/,/g,"&");
    valid = valid.replace(/\//g,"%2F");
    // console.log(valid);
    
    if(optParams.fields !=undefined)
    {
        valid = valid+makeValidFields(fields);
    }
    
    return valid;
}

function makeValidFields(fields) {
    var valid = fields.replace(/,/g,"%2C");
    return valid;
    
}
