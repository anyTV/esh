var google = "";
var GoogleResource = function()
{
    this.google = "a";
    this.provider = "";
    __contruct = function(that)
    {
        console.log(that);
        that.google = new OAuth2('google', {
                    client_id: '544761083604-8327g2lmsbjd37hlodt548p5hb5r09ua.apps.googleusercontent.com',
                    client_secret: 'gf-nrcXIUF3fuLR4blDqwfa3',
                    api_scope: "https://www.googleapis.com/auth/youtubepartner+"+
                                "https://www.googleapis.com/auth/youtube+"+
                                "https://www.googleapis.com/auth/userinfo.email"
                });
        that.provider = that.google;
    }(this)
}

GoogleResource.prototype.hasAccessToken= function()
{
    return this.provider.hasAccessToken();
}
GoogleResource.prototype.getAccessToken = function()
{
    return this.provider.getAccessToken();
}
GoogleResource.prototype.clearAccessToken = function()
{
    return this.provider.clearAccessToken();
}
GoogleResource.prototype.authorize=function()
{
    this.provider.authorize(function(){
        return "success";
    });
}
GoogleResource.prototype.isAccessTokenExpired = function()
{
    this.provider.isAccessTokenExpired();
}


var YoutubeResource = function(config){
    this.key = "AIzaSyAhkr8hbq6J0_4HD8ANO4DQqPoHmQFiFDY"; //REPLACE THE KEY WITH YOUR KEY
    var queryType = "https://www.googleapis.com/youtube/v3/channels";  // default query type
    
    if(config.type=='listPlaylistItems')
        queryType = 'https://www.googleapis.com/youtube/v3/playlistItems';
    else if(config.type =="listVideos")
        queryType = 'https://www.googleapis.com/youtube/v3/videos';
    else if(config.type =="getPeople")
        queryType='https://www.googleapis.com/plus/v1/people/me';
    
    this.type = queryType;
}


YoutubeResource.prototype.queryURL = function(params,filter, optParams){
    
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

function makeValid(optParams)
{
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

function makeValidFields(fields)
{
    var valid = fields.replace(/,/g,"%2C");
    return valid;
    
}
