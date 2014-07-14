// var oauth = ChromeExOAuth.initBackgroundPage({
//   'request_url': 'https://www.google.com/accounts/OAuthGetRequestToken',
//   'authorize_url': 'https://www.google.com/accounts/OAuthAuthorizeToken',
//   'access_url': 'https://www.google.com/accounts/OAuthGetAccessToken',
//   'consumer_key': '544761083604-g7tgv07lnniorr68ntdj2ceda913a8bd.apps.googleusercontent.com',
//   'consumer_secret': 'Lu8YM5refuggybua7Sdx_vmO',
//   'scope': "https://www.googleapis.com/auth/youtubepartner "+
//             "https://www.googleapis.com/auth/youtube "+
//             "https://www.googleapis.com/auth/userinfo.email",
//   'app_name': 'Videobar on YouTube'
// });

chrome.extension.onRequest.addListener(function(request, sender) {
    chrome.tabs.update(sender.tab.id, {url: request.redirect});
});

function backgroundCtrl($scope,$http,backgroundServices)
{

    chrome.tabs.onUpdated.addListener(function(tabId) {
        
        chrome.tabs.getSelected(null, function(tab) {
            var extId = chrome.runtime.id;
            if(tab.url.search("chrome-extension://"+extId+"/oauth2/oauth2.html")> -1 && tab.openerTabId)
            {
                // console.log(tab.openerTabId);
                var openerId = tab.openerTabId;
                chrome.tabs.get(tab.openerTabId,function(tab)
                {
                    if(tab.url.search(extId+"/options.html")> -1)
                    {
                        chrome.tabs.reload(openerId);        
                    }
                });
                
            }
            
             if (tab.url.search("youtube") > -1 ) //this means a video is playing
             {
                 var vId = getParameterByName("v",tab.url);
                 // console.log(vId);
                 if(vId != "")
                 {
                     console.log(tab.id);
                    chrome.pageAction.show(tabId);
                    backgroundServices.hasAnnotation().then(function(datas)
                    {
                        if(datas)
                        {
                            chrome.pageAction.setIcon({tabId:tab.id,path:"images/19-g.png"});
                        }
                    });
                    
                 }
              }
              else
              {
                  chrome.pageAction.hide(tabId);
              }
        });
    });
    
}

