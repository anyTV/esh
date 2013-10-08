function backgroundCtrl($scope,$http,backgroundServices)
{
    chrome.tabs.onUpdated.addListener(function(tabId) {
        
        chrome.tabs.getSelected(null, function(tab) {
            console.log(tab);
            
            if(tab.url.search("hlmaejpfpopoibdjhhjiifccckpaadcb/oauth2/oauth2.html")> -1 && tab.openerTabId)
            {
                // console.log(tab.openerTabId);
                var openerId = tab.openerTabId;
                chrome.tabs.get(tab.openerTabId,function(tab)
                {
                    if(tab.url.search("hlmaejpfpopoibdjhhjiifccckpaadcb/options.html")> -1)
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

