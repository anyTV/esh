/**
 * @author esh
 */

myExt.factory("annotationsServices",function($http,$q,$rootScope,backgroundServices)
{
    var idPrefix= "annotation_"
    var btnBase = '<annotation id="annotation_" type="highlight" log_data="xble=1">'+
                        '<segment>'+
                        '<movingRegion type="rect">'+
                        '<rectRegion x="0.00000" y="0.00000" w="11.05400" h="12.56300" t="0:00.000"/>'+
                        '<rectRegion x="0.00000" y="0.00000" w="11.05400" h="12.56300" t="3:00.000"/>'+
                        '</movingRegion>'+
                        '</segment>'+
                        '<appearance bgColor="0" highlightWidth="0" borderAlpha="0.0"/>'+
                        '<action type="openUrl" trigger="click">'+
                        '<url target="current" value="linkhere" link_class="1"/>'+
                        '</action>'+
                    '</annotation>';
    var txtBase =   '<annotation id="annotation_" type="text" style="highlightText" logable="false">'+
                        '<TEXT>text here</TEXT>'+
                        '<segment spaceRelative="annotation_">'+
                        '<movingRegion type="rect">'+
                        '<rectRegion x="11.93500" y="7.54900" w="3.89900" h="6.87300" t="never"/>'+
                        '<rectRegion x="11.93500" y="7.54900" w="3.89900" h="6.87300" t="never"/>'+
                        '</movingRegion>'+
                        '</segment>'+
                        '<appearance bgAlpha="0" textSize="3.911599999999999" highlightFontColor="15921906"/>'+
                        '<trigger>'+
                        '<condition ref="annotation_" state="rollOver"/>'+
                        '</trigger>'+
                    '</annotation>';
   var base = '<document><annotations></annotations></document>';
    var baseWidth = 10.95700;
    var baseHeight = 12.0000;
    var baseTxtHeight = 6.87300;
    var baseBtn_Y = 0;
    var baseBtn_X = 0;
    
    
    var letters = {
        
"1": "1.3265",
"2": "1.3265",
"3": "1.3265",
"4": "1.3265",
"5": "1.3265",
"6": "1.3265",
"7": "1.3265",
"8": "1.3265",
"9": "1.3265",
"A": "1.4849",
"a": "1.3249",
"B": "1.4834",
"b": "1.3249",
"C": "1.6419",
"c": "1.1665",
"D": "1.6419",
"d": "1.3249",
"E": "1.4834",
"e": "1.3249",
"F": "1.4834",
"f": "0.691",
"G": "1.8004",
"g": "1.3249",
"H": "1.4834",
"h": "1.3408",
"I": "0.5325",
"i": "0.5325",
"J": "1.008",
"j": "0.5325",
"K": "1.4993",
"k": "1.1665",
"L": "1.3249",
"l": "0.5325",
"M": "1.8004",
"m": "1.8004",
"N": "1.4834",
"n": "1.3249",
"O": "1.8004",
"o": "1.3249",
"P": "1.4834",
"p": "1.3249",
"Q": "1.8003",
"q": "1.3407",
"R": "1.6735",
"r": "0.8494",
"S": "1.4992",
"s": "1.1823",
"T": "1.4834",
"t": "0.691",
"U": "1.4834",
"u": "1.3249",
"V": "1.4834",
"v": "1.1664",
"W": "2.1236",
"w": "1.4897",
"X": "1.3312",
"x": "1.0301",
"Y": "1.4897",
"y": "1.1727",
"Z": "1.3312",
"z": "1.0143",
"'": "0.5388",
"-": "0.8558",
":": "0.6973",
"(": "0.8558",
")": "0.8558",
"!": "0.8558",
" ": "0.6487",
    }
    
    //13.31200 10 As
    
    function arrangeAnnotation(node,new_size)
    {
        // console.log(node);
        
         // console.log(node.getElementsByTagName("segment")[0]);
         var segmentNode = node.getElementsByTagName("segment")[0];
         // console.log(segmentNode);
         var movingRegionNodes = segmentNode.getElementsByTagName("movingRegion")[0];
         var movingRegionType = movingRegionNodes.attributes.type.value;
         (movingRegionType == 'rect')?(regionNodes = movingRegionNodes.getElementsByTagName(movingRegionType+"Region")):(regionNodes = movingRegionNodes.getElementsByTagName(movingRegionType+"Region"));
         
         regionNodes[0].setAttribute("w",new_size.width);
         regionNodes[1].setAttribute("w",new_size.width);
         
         regionNodes[0].setAttribute("h",new_size.height); // 135px divided by 1.143
         regionNodes[1].setAttribute("h",new_size.height);

        return node;
    }
    
    
    function computeTxtSize(txt)
    {
        // var new_size;
        // return new_size
        var height =baseTxtHeight;
        var width = 0;
        for(i=0;i<txt.length;i++)
        {
            var c = txt.charAt(i);
            // console.log(c);
            if(letters[c]==undefined)
                var w = "0.7";
            else var w = letters[c];
            width+=parseFloat(w);
        }
        width = width+0.5;
        console.log(width);
        if(width>25)
        {
            // height*=2;
        }
        
        return {"w":width,"h":height};
    }
    
    function tolerate(tolerance)
    {
        var pass= false;
        var cont = true;
        for(i=-tolerance;i<tolerance;i++)
        {
            if(cont == true)
            {
                if(arguments[1]+i == arguments[2])
                {
                    pass=true;
                    cont = false;
                }
            }
        }
        // console.log(pass);
        return pass;
    }
    
    function getTime(start,stop)
    {
        var startSeconds = hmsToSeconds(start);
        var stopSeconds = hmsToSeconds(stop);
        var duration = stopSeconds-startSeconds;
        return ({"start_time":startSeconds,"stop_time":stopSeconds,"duration_time":duration});
    }
    
    function durationChangeFull(xml,start,stop)
    {
        angular.forEach(xml.getElementsByTagName("updatedItems")[0].childNodes,function(node)
        {
            if(node.nodeName == "annotation")
            {
                if(node.attributes.type.value == 'highlight' || (node.attributes.type.value == 'text'&& node.attributes.style.value != 'highlightText'))
                {
                    console.log(node);
                     // console.log(node.getElementsByTagName("segment")[0]);
                     var segmentNode = node.getElementsByTagName("segment")[0];
                     // console.log(segmentNode);
                     var movingRegionNodes = segmentNode.getElementsByTagName("movingRegion")[0];
                     var movingRegionType = movingRegionNodes.attributes.type.value;
                     (movingRegionType == 'rect')?(regionNodes = movingRegionNodes.getElementsByTagName(movingRegionType+"Region")):(regionNodes = movingRegionNodes.getElementsByTagName(movingRegionType+"Region"));
                     
                     regionNodes[0].setAttribute("t",start)
                     regionNodes[1].setAttribute("t",stop)
                }
            }
        });
        return xml;
    }
    
    function durationChange2(node,new_annotationTime)
    {
        var segmentNode = node.getElementsByTagName("segment")[0];
         var movingRegionNodes = segmentNode.getElementsByTagName("movingRegion")[0];
         var movingRegionType = movingRegionNodes.attributes.type.value;
         (movingRegionType == 'rect')?(regionNodes = movingRegionNodes.getElementsByTagName(movingRegionType+"Region")):(regionNodes = movingRegionNodes.getElementsByTagName(movingRegionType+"Region"));
         
         regionNodes[0].setAttribute("t",(new_annotationTime.start_time));
         regionNodes[1].setAttribute("t",(new_annotationTime.stop_time));
         // console.log(node);
         return node;
    }
    
    function actionURLCreator(action)
    {
        if(action.time !=undefined)
        {
            var time = secondsToHms(action.time,true);
            var url = "http://www.youtube.com/watch?v="+action.id+"#t="+time;    
        }
        else if(action.channel !=undefined)
        {
            var url = "http://www.youtube.com/"+action.channel;
        }
        else if(action.url !=undefined)
        {
            var url = action.url;
        }
        
        return url;
    }
    
    function actionChanger(node,actionURL)
    {
        // var url2 = "http://www.youtube.com/watch?v=zW7El0pMXLQ&list=PLyI74zGGymu-GgRctTwDzleQQPcSGIk-W&t=1m34s";
        // console.log(action);
        
        var actionNode = node.getElementsByTagName("action")[0];
        
        if(actionURL == "")
            node.removeChild(actionNode);
        else
        {
            var urlNode = actionNode.getElementsByTagName('url')[0];
            urlNode.setAttribute("value",actionURL);            
        }

        return node;
    }
    
    function cloneNode(node,xml)
    {
        // console.log(node);
        var newBtnElem = node.xml.cloneNode(true);
                                // console.log(newBtnElem);            
        newBtnElem.setAttribute("id",node.id);
        
        var updatedItemsNode = xml.getElementsByTagName("annotations")[0];
        updatedItemsNode.appendChild(newBtnElem);
        return newBtnElem;
    }
    
    function changeNodeName(oldNodeName,newNodeName,xml)
    {
        var oldNode = xml.getElementsByTagName(oldNodeName)[0],
        newNode = xml.createElement(newNodeName);
        
        angular.forEach(oldNode.childNodes,function(node)
        {
            newNode.appendChild(node);
            // console.log(node); 
        });
        console.log(oldNode);
        console.log(newNode);
        // newNode.className = oldNode.className;
        newNode.attributes = oldNode.attributes;
        // Do attributes too if you need to
        newNode.id = oldNode.id; // (Not invalid, they're not both in the tree at the same time)
        oldNode.parentNode.replaceChild(newNode, oldNode);
        return newNode;
    }
    
    function templateDefaults(button,video,node,mainNode)
    {
        button.instances.splice(1);
        // console.log(button);
        if(button.instances[0].id == "videobar_skip1" || button.instances[0].id == "videobar_skip2" || button.instances[0].id == "videobar_skip3")
        {
            var duration = (hmsToSeconds(video.duration)-30)/3;
            var start =0,end = duration,time=[];
            for(i=0;i<3;i++)
            {
                time[i] = {"start_time":start,"stop_time":end};
                start = end;
                end +=duration;
                // console.log(time);
            }
            if(button.instances[0].id == "videobar_skip1")
            {
                // button.instances[0].action = actionURLCreator({"time":time[0].stop_time,"id":video.id});
                button.instances[0].action = {"time":secondsToHms(time[0].stop_time)};
                // button.instances[0].duration.start = 0;
                // button.instances[0].duration.stop = video.duration;
                // button.text
            }
            else if(button.instances[0].id == "videobar_skip2")
            {
                // button.instances[0].action = actionURLCreator({"time":time[1].stop_time,"id":video.id});
                button.instances[0].action = {"time":secondsToHms(time[1].stop_time)};
                // button.instances[0].duration.start = 0;
                // button.instances[0].duration.stop = video.duration;
                // button.text
            }
            else if(button.instances[0].id == "videobar_skip3")
            {
                // button.instances[0].action = actionURLCreator({"time":time[2].stop_time,"id":video.id});
                button.instances[0].action = {"time":secondsToHms(time[2].stop_time)};
                // button.instances[0].duration.start = 0;
                // button.instances[0].duration.stop = video.duration;
                // button.text
            }
            
            // console.log(duration);
        }
        else if(button.instances[0].id == "videobar_skip")
        {
            var clonedNodes = [];
            
            var instance = Math.ceil((hmsToSeconds(video.duration)/30));
            console.log("Number of instances: "+instance);
            var duration = 30,
            start =0,end=duration,time=[];
            
            for(i=1;i<=instance;i++)
            {
                time[i]={"start_time":start,"stop_time":end};
                start=end;
                end+=duration;
                // console.log(time);
                var annotationText = "Skip ahead 30 seconds";
                if(i==1)
                {
                    // button.instances[0].action = actionURLCreator({"time":time[i].stop_time,"id":video.id});
                    button.instances[0].action = {"time":secondsToHms(time[i].stop_time)};
                    button.instances[0].duration.start = secondsToHms(time[i].start_time);
                    button.instances[0].duration.stop = secondsToHms(time[i].stop_time);
                    button.instances[0].text = annotationText;
                }
                else
                {
                    if(i==instance)
                    {
                        var new_action = {"time":secondsToHms(time[1].start_time)};
                        // var new_action = actionURLCreator({"time":time[1].start_time,"id":video.id});
                        annotationText = "Back to beginning";
                    }
                    else
                        var new_action = {"time":secondsToHms(time[i].stop_time)};
                        // var new_action = actionURLCreator({"time":time[i].stop_time,"id":video.id});
                    
                    button.instances.push({
                        "action":new_action,
                        "duration":{"start":secondsToHms(time[i].start_time),"stop":secondsToHms(time[i].stop_time)},
                        "editable":true,
                        "id":idPrefix+button.instances[0].id+"_"+i,
                        "text":annotationText,
                        "textId":idPrefix+button.instances[0].textId+"_"+i
                    });
                }
                
            }
        }
        else if(button.instances[0].id == "videobar_home")
        {
            button.instances[0].action = {"url":actionURLCreator({"id":video.id,"channel":$rootScope.userInfo.channel.username})};
            button.instances[0].duration.start = 0;
            button.instances[0].duration.stop = video.duration;
        }
        else if(button.instances[0].id == "videobar_channel")
        {
            button.instances[0].action = {"url":actionURLCreator({"id":video.id,"channel":$rootScope.userInfo.channel.username})};
            button.instances[0].duration.start = 0;
            button.instances[0].duration.stop = video.duration;
        }
        else if(button.instances[0].id == "videobar_next")
        {
            button.instances[0].action = {"url":actionURLCreator({"id":video.id,"time":hmsToSeconds(video.duration)})};
            button.instances[0].duration.start = 0;
            button.instances[0].duration.stop = video.duration;
        }
        else if(button.instances[0].id == "videobar_star")
        {
            button.instances[0].action = {"url":""};
            button.instances[0].text = "(Feature coming soon)";
        }
        else
        {
            if(button.actiontype == "url")
            {
                button.instances[0].action = {"url":""};
                button.instances[0].duration.start = 0;
                button.instances[0].duration.stop = video.duration;
                // button.instances[0].text = "";
            }
            else
            {
                button.instances[0].action = {"time":"0:00"};
                button.instances[0].duration.start = 0;
                button.instances[0].duration.stop = video.duration;
                // button.instances[0].text = "";
            }
        }
        /////////////ORIGINAL///////////////////
   
        return button;
    }
    
    function createAnnotations(xmlIds)
    {
        var baseBtnXml = textToXML(btnBase);
        var baseTxtXml = textToXML(txtBase);
        var baseXml = textToXML(base);
        
        vidIdlen = 0;
        angular.forEach(xmlIds,function(id)
        {
            if(id.size == undefined && id.pos == undefined)
             vidIdlen++; 
        });
        
        baseHeight = 100 / vidIdlen;
        baseBtn_Y = 0;
        baseBtn_X = 0;
        console.log("height: "+baseHeight);
        
        // var finalResult = [];
        angular.forEach(xmlIds,function(identifier)
        {
            var cloneBtnNode = baseBtnXml.getElementsByTagName("annotation")[0].cloneNode(true);
            var cloneTxtNode = baseTxtXml.getElementsByTagName("annotation")[0].cloneNode(true);
            
            cloneBtnNode.setAttribute("id",idPrefix+identifier.ids.btn);
            cloneTxtNode.setAttribute("id",idPrefix+identifier.ids.text);
            
            cloneTxtNode.getElementsByTagName("segment")[0].setAttribute("spaceRelative",idPrefix+identifier.ids.btn);
            cloneTxtNode.getElementsByTagName("trigger")[0].getElementsByTagName("condition")[0].setAttribute("ref",idPrefix+identifier.ids.btn);
            
            var movingRegionNode_btn = cloneBtnNode.getElementsByTagName("segment")[0].getElementsByTagName('movingRegion')[0];
            var movingRegionType_btn = movingRegionNode_btn.attributes.type.value;
            (movingRegionType_btn == 'rect')?(regionNodes_btn = movingRegionNode_btn.getElementsByTagName(movingRegionType_btn+"Region")):(regionNodes_btn = movingRegionNode_btn.getElementsByTagName(movingRegionType_btn+"Region"));
            
            var duration = {"start":regionNodes_btn[0].attributes.t.value,"stop":regionNodes_btn[1].attributes.t.value};
            
            
            var movingRegionNode_txt = cloneTxtNode.getElementsByTagName
            
            
            
            if(identifier.size != undefined && identifier.pos != undefined)
            {
                angular.forEach(regionNodes_btn,function(btnNode)
                {
                    btnNode.setAttribute("w",identifier.size.w);
                    btnNode.setAttribute("h",identifier.size.h);
                    btnNode.setAttribute("x",identifier.pos.x);
                    btnNode.setAttribute("y",identifier.pos.y);                        
                });
                
                
            }
            else
            {
                angular.forEach(regionNodes_btn,function(btnNode)
                {
                    btnNode.setAttribute("w",baseWidth);
                    btnNode.setAttribute("h",baseHeight-0.5);
                    btnNode.setAttribute("x",baseBtn_X);
                    
                    btnNode.setAttribute("y",baseBtn_Y);                        
                });
                baseBtn_Y+=baseHeight;
            }
            
            
            // console.log(cloneBtnNode);
            // console.log(cloneTxtNode);
            
            var updatedItemsNode = baseXml.getElementsByTagName("annotations")[0];
            updatedItemsNode.appendChild(cloneBtnNode);
            updatedItemsNode.appendChild(cloneTxtNode); 
            
        });
        
        return baseXml;
    }
    
    function createURL(url,param)
    {
        var paramStr = JSON.stringify(param);
        paramStr = paramStr.replace(/\{|\}|\"|/g,"");
        paramStr = paramStr.replace(/:/g,"=");
        return url+"?"+paramStr;
    }
    
    function getAction(node,actiontype)
    {
        var actionNode = node.getElementsByTagName("action")[0];
        if(actionNode != null)
        {
            var urlNode = actionNode.getElementsByTagName("url")[0];
            var urlAction = urlNode.attributes.value.value;
            
            var action = [];
            if(actiontype == "time")
            {
                // console.log() 
                var time = getParameterByName("t",urlAction);
                // console.log(urlAction + " : "+time);
                if(time!=null)
                {
                    time = time.replace(/m|h/g,":");
                    time = time.replace(/s/g,"");
                    isTime = true;
                    action = {"time":time};
                }
                else
                {
                    isTime = false;
                    action = {"time":""};
                }
                        
            }
            else
            {
                action = {"url":urlAction};
            }
        }
        else
        {
            action = {"url":""};
        }
        
        return action;
    }
    function getDuration(node)
    {
        var segmentNode = node.getElementsByTagName("segment")[0];
        var movingRegionNodes = segmentNode.getElementsByTagName("movingRegion")[0];
        var movingRegionType = movingRegionNodes.attributes.type.value;
        (movingRegionType == 'rect')?(regionNodes = movingRegionNodes.getElementsByTagName(movingRegionType+"Region")):(regionNodes = movingRegionNodes.getElementsByTagName(movingRegionType+"Region"));
         
        return {"start":regionNodes[0].attributes.t.value,"stop":regionNodes[1].attributes.t.value};
    }
    
    function positionChanger(node,pos)
    {
        var movingRegionNode_btn = node.getElementsByTagName("segment")[0].getElementsByTagName('movingRegion')[0];
        var movingRegionType_btn = movingRegionNode_btn.attributes.type.value;
        (movingRegionType_btn == 'rect')?(regionNodes_btn = movingRegionNode_btn.getElementsByTagName(movingRegionType_btn+"Region")):(regionNodes_btn = movingRegionNode_btn.getElementsByTagName(movingRegionType_btn+"Region"));
        angular.forEach(regionNodes_btn,function(btnNode)
        {
            btnNode.setAttribute("x",pos.x);
            btnNode.setAttribute("y",pos.y);                        
        });
        return node; 
    }
    function sizeChanger(node,size)
    {
        var movingRegionNode_btn = node.getElementsByTagName("segment")[0].getElementsByTagName('movingRegion')[0];
        var movingRegionType_btn = movingRegionNode_btn.attributes.type.value;
        (movingRegionType_btn == 'rect')?(regionNodes_btn = movingRegionNode_btn.getElementsByTagName(movingRegionType_btn+"Region")):(regionNodes_btn = movingRegionNode_btn.getElementsByTagName(movingRegionType_btn+"Region"));
        angular.forEach(regionNodes_btn,function(btnNode)
        {
            btnNode.setAttribute("w",size.w);
            btnNode.setAttribute("h",size.h);                        
        });
        return node;
    }
    function textNodeReferenceIdchanger(txtNode,refId)
    {
        txtNode.getElementsByTagName("segment")[0].setAttribute("spaceRelative",refId);
        txtNode.getElementsByTagName("trigger")[0].getElementsByTagName("condition")[0].setAttribute("ref",refId);
        return txtNode;
    }
    function textNodeChanger(txtNode,text)
    {
        var btnPosSize = arguments[2]; //optional
        var TEXTNode = txtNode.getElementsByTagName("TEXT");
        TEXTNode[0].textContent = text;
        var new_size = computeTxtSize(text);
        console.log(btnPosSize);
        if(btnPosSize.pos != undefined && btnPosSize.size != undefined)
        {
            var new_pos = computeTxtPosition(btnPosSize,new_size);
            console.log(new_pos);
            txtNode = positionChanger(txtNode,new_pos);
        }
        
        txtNode = sizeChanger(txtNode,new_size);
        // console.log(txtNode);
        return txtNode; 
    }
    function computeTxtPosition(btn_pos_size,txt_size)
    {
        var x = 0;
        var y = 0;
        
        var max_x = 100;
        var max_y = 100;
        
        // {"w":15.937,"h":17.514},"pos":{"x":84.063,"y":82.500}
        
        if((btn_pos_size.pos.x + txt_size.w) > max_x)
        {
            x = txt_size.w*-1;
            y = btn_pos_size.size.h/2-(txt_size.h/2);
        }
        else if((btn_pos_size.pos.x - txt_size.w)< 0)
        {
            x = btn_pos_size.size.w+1;
            y = btn_pos_size.size.h/2-(txt_size.h/2);
        }
        else
        {
            x = btn_pos_size.size.w/2 - (txt_size.w/2);
            y = btn_pos_size.size.h;
        }
        
        return {"x":x,"y":y};
    }
    
    return {
        updateXML:function(xmlString,id)
        {
            var optMode = arguments[2];
            if(optMode == "delete")
            {
                xmlString = xmlString.replace(/<annotations/g,"<deletedItems");
                xmlString = xmlString.replace(/<\/annotations>/g,"</deletedItems>");
                
                xmlString = xmlString.replace(/<annotation/g,"<deletedItem ");
                xmlString = xmlString.replace(/<\/annotation>/g,"</deletedItem>");
                xml = textToXML(xmlString);
                // console.log(xml);
                angular.forEach(xml.getElementsByTagName("deletedItems")[0].childNodes,function(node)
                {
                    if(node.nodeName == "deletedItem")
                    {
                        node.setAttribute("author","");
                    }
                });
            }
            else if(optMode == "save") // xml for save 
            {
                xmlString = xmlString.replace(/<annotations/g,"<updatedItems");
                xmlString = xmlString.replace(/<\/annotations>/g,"</updatedItems>");
                xml = textToXML(xmlString);
                // console.log(xml);
                // if(!isTemplate())
                // {
                    // var annotationsSorted = decodeXML(xml,hmsToSeconds(getSourceVideoInfo().contentDetails.duration));
                    // fixTime(annotationsSorted,{"source":hmsToSeconds(getSourceVideoInfo().contentDetails.duration),"destination":hmsToSeconds(id.duration)});    
                // }
                // else
                // {
                    // xml = durationChangeFull(xml,0.000,id.duration);
                // }
                //
                // xml = arrangeAnnotation(xml);
            }
            else //xml for publish
                xml = textToXML(xmlString);
                
            requestHeaderElement = xml.createElement("requestHeader");
            authenticationHeaderElement = xml.createElement("authenticationHeader");
            
            xml.documentElement.appendChild(requestHeaderElement);
            xml.documentElement.appendChild(authenticationHeaderElement);
            
            xml.getElementsByTagName("requestHeader")[0].setAttribute("video_id",id.video);
            xml.getElementsByTagName("authenticationHeader")[0].setAttribute("auth_token",id.token);
            
            // console.log(xml);
            return xml;
        },
        decodeXML:function(xml,sourceVideoDuration)
        {
            var annotationArray = [];
            var annotationsSorted = {
              "startRelative":new Array(),
              "stopRelative":new Array(),
              "stretchFromStart":new Array(),
              "stretchFromEnd":new Array(),  
              "fullDuration":new Array()
            };
            
            var i =0;
            angular.forEach(xml.getElementsByTagName("updatedItems")[0].childNodes,function(node)
            {
                if(node.nodeName == "annotation")
                {
                    if(node.attributes.type.value == 'highlight' || (node.attributes.type.value == 'text'&& node.attributes.style.value != 'highlightText'))
                    {
                        var segmentNode = node.getElementsByTagName("segment")[0];
                         // console.log(segmentNode);
                         var movingRegionNodes = segmentNode.getElementsByTagName("movingRegion")[0];
                         var movingRegionType = movingRegionNodes.attributes.type.value;
                         (movingRegionType == 'rect')?(regionNodes = movingRegionNodes.getElementsByTagName(movingRegionType+"Region")):(regionNodes = movingRegionNodes.getElementsByTagName(movingRegionType+"Region"));
                        
                        var annotationTime=getTime(regionNodes[0].attributes.t.value,regionNodes[1].attributes.t.value);
                        // console.log(annotationTime);                    
                        
                        annotationArray[i]= {"xml":node,"id":node.attributes.id.value,"time":annotationTime};
                        
                        if(tolerate(3,sourceVideoDuration,annotationArray[i].time.stop_time) && tolerate(3,0,annotationArray[i].time.start_time))
                        {
                            console.log("full duration");
                            annotationsSorted.fullDuration.push(annotationArray[i]);
                        }
                        else if(tolerate(3,sourceVideoDuration,annotationArray[i].time.stop_time))
                        {
                            if(annotationArray[i].time.start_time >= sourceVideoDuration/2)
                            {
                                console.log("END POINT RELATIVE");
                                annotationsSorted.stopRelative.push(annotationArray[i]);
                            }
                            else
                            {
                                annotationsSorted.stretchFromEnd.push(annotationArray[i]);
                                // console.log(annotationArray[i]);
                                console.log("stretch this");
                            }
                        }
                        else if(tolerate(3,0,annotationArray[i].time.start_time))
                        {
                            if(annotationArray[i].time.stop_time <= sourceVideoDuration/2)
                            {
                                console.log("START POINT RELATIVE");
                                annotationsSorted.startRelative.push(annotationArray[i]);
                            }
                            else
                            {
                                annotationsSorted.stretchFromStart.push(annotationArray[i]);
                                // console.log(annotationArray[i]);
                                console.log("stretch this");
                            }
                        }
                        i++;   
                    }
                }
            });
            
            console.log(annotationsSorted);
            return annotationsSorted;
        },
        fixTime:function(annotationsSorted,duration)
        {
            var startTime="",stopTime="";
            
            angular.forEach(annotationsSorted.startRelative, function(annot)
            {
                var new_stop_time = 0 + annot.time.duration_time;
                annot.xml = durationChange2(annot.xml,{"duration":annot.time.duration,"start_time":0,"stop_time":new_stop_time});
                if(stopTime=="" || new_stop_time > stopTime)
                stopTime = new_stop_time;
            });
            
            angular.forEach(annotationsSorted.stopRelative,function(annot)
            {
                var new_start_time = duration.destination - annot.time.duration_time;
                annot.xml = durationChange2(annot.xml,{"duration":annot.time.duration,"start_time":new_start_time,"stop_time":duration.destination});
                if(startTime=="" || new_start_time > startTime)
                startTime = new_start_time;
            });
            
            // console.log(startTime);
            // console.log(stopTime);
            
            angular.forEach(annotationsSorted.stretchFromStart,function(annot)
            {
                annot.xml = durationChange2(annot.xml,{"duration":annot.time.duration,"start_time":0,"stop_time":startTime});
            });
            angular.forEach(annotationsSorted.stretchFromEnd,function(annot)
            {
                annot.xml = durationChange2(annot.xml,{"duration":annot.time.duration,"start_time":stopTime,"stop_time":duration.destination});
            });
    
            angular.forEach(annotationsSorted.fullDuration,function(annot)
            {
                annot.xml=durationChange2(annot.xml,{"duration":duration.destination,"start_time":0,"stop_time":duration.destination}); 
            });        
            
            // console.log(annotationsSorted.stopRelative[0].xml);
        },
        customizeTemplate:function(template,video)
        {
            console.log("Customizing Template");
            // console.log(template);
        var baseBtnXml = textToXML(btnBase);
        var baseTxtXml = textToXML(txtBase);
        var baseXml = textToXML(base);
        
        vidIdlen = 0;
        angular.forEach(template.buttons,function(button)
        {
            if(button.size == undefined && button.pos == undefined)
             vidIdlen++; 
        });
        
        baseHeight = 100 / vidIdlen;
        baseBtn_Y = 0;
        baseBtn_X = 0;
        console.log("height: "+baseHeight);
        
        // var finalResult = [];
        angular.forEach(template.buttons,function(button)
        {
            // console.log(button);
            var cloneBtnNode = cloneNode({"xml":baseBtnXml.childNodes[0],"id":idPrefix+button.instances[0].id},baseXml);
            var cloneTxtNode = cloneNode({"xml":baseTxtXml.childNodes[0],"id":idPrefix+button.instances[0].textId},baseXml);
            
            cloneTxtNode = textNodeReferenceIdchanger(cloneTxtNode,idPrefix+button.instances[0].id);
            cloneTxtNode = textNodeChanger(cloneTxtNode,button.instances[0].text,{"pos":button.pos,"size":button.size});
            
            if(button.actiontype == "time")
                cloneBtnNode = actionChanger(cloneBtnNode,actionURLCreator({"id":video.id,"time":hmsToSeconds(button.instances[0].action.time)}));
            else 
                cloneBtnNode = actionChanger(cloneBtnNode,button.instances[0].action.url);
            
            if(button.actiontype == "time" && button.addable == false)
                var duration = {"start_time":"0","stop_time":video.duration};    
            else if(button.actiontype == "time"&& button.addable == true)
                var duration = {"start_time":"0","stop_time":(hmsToSeconds(button.instances[0].action.time)==0)?(video.duration):(button.instances[0].action.time)};    
            else if(button.actiontype == "url" && button.addable == false)
                var duration = {"start_time":"0","stop_time":video.duration};   
            else if(button.actiontype == "url" && button.addable == true)
                var duration = {"start_time":button.instances[0].duration.start,"stop_time":button.instances[0].duration.stop};   
            
            cloneBtnNode = durationChange2(cloneBtnNode,duration);
            
            if(button.instances.length > 1)
            {
                var i =0;
                angular.forEach(button.instances,function(instance)
                {
                    if(i!=0)
                    {
                        var newBtnElem = cloneNode({"xml":baseBtnXml.childNodes[0],"id":instance.id},baseXml);
                        var newTxtElem = cloneNode({"xml":baseTxtXml.childNodes[0],"id":instance.textId},baseXml);
                        
                        newTxtElem = textNodeReferenceIdchanger(newTxtElem,instance.id);
                        newTxtElem = textNodeChanger(newTxtElem,instance.text,{"pos":button.pos,"size":button.size});
                        
                        if(button.size != undefined && button.pos != undefined)
                        {
                            newBtnElem = sizeChanger(newBtnElem,button.size);
                            newBtnElem = positionChanger(newBtnElem,button.pos);
                        }
                        else
                        {
                            newBtnElem = sizeChanger(newBtnElem,{"w":baseWidth,"h":baseHeight-0.5});
                            newBtnElem = positionChanger(newBtnElem,{"x":baseBtn_X,"y":baseBtn_Y});
                        }
                        
                        if(button.actiontype == "time") 
                        {
                            newBtnElem = actionChanger(newBtnElem,actionURLCreator({"id":video.id,"time":hmsToSeconds(instance.action.time)}));
                            if(i == button.instances.length-1)
                                var duration = {"start_time":button.instances[i-1].action.time,"stop_time":video.duration};
                            else
                                var duration = {"start_time":button.instances[i-1].action.time,"stop_time":instance.action.time};
                        }
                        else
                        {
                            newBtnElem = actionChanger(newBtnElem,instance.action.url);
                            var duration = {"start_time":instance.duration.start,"stop_time":instance.duration.stop};
                        }
                        
                        newBtnElem = durationChange2(newBtnElem,duration);
                    }
                    i++;
                });
            }
            
            if(button.size != undefined && button.pos != undefined)
            {
                cloneBtnNode = sizeChanger(cloneBtnNode,button.size);
                cloneBtnNode = positionChanger(cloneBtnNode,button.pos);
            }
            else
            {
                cloneBtnNode = sizeChanger(cloneBtnNode,{"w":baseWidth,"h":baseHeight-0.5});
                cloneBtnNode = positionChanger(cloneBtnNode,{"x":baseBtn_X,"y":baseBtn_Y});
                baseBtn_Y+=baseHeight;
            }
            
            
        });
            
            return baseXml;
            
            /*
            angular.forEach(xml.getElementsByTagName("annotations")[0].childNodes,function(node)
            {
                if(node.nodeName == "annotation")
                {
                    angular.forEach(template.buttons,function(button)
                    {
                        // console.log(button);
                        if(idPrefix+button.instances[0].id == node.attributes.id.value)
                        {
                            // if(!button.edited == true)
                            // {
                                // button = templateDefaults(button,video,node,xml);
                            // }
                                
                                if(button.actiontype == "time")
                                    node = actionChanger(node,actionURLCreator({"id":video.id,"time":hmsToSeconds(button.instances[0].action.time)}));
                                else 
                                    node = actionChanger(node,button.instances[0].action.url);
                                
                                if(button.actiontype == "time" && button.addable == false)
                                    var duration = {"start_time":"0","stop_time":video.duration};    
                                else if(button.actiontype == "time"&& button.addable == true)
                                    var duration = {"start_time":"0","stop_time":(hmsToSeconds(button.instances[0].action.time)==0)?(video.duration):(button.instances[0].action.time)};    
                                else if(button.actiontype == "url" && button.addable == false)
                                    var duration = {"start_time":"0","stop_time":video.duration};   
                                else if(button.actiontype == "url" && button.addable == true)
                                    var duration = {"start_time":button.instances[0].duration.start,"stop_time":button.instances[0].duration.stop};   
                                
                                // console.log(button);
                                node = durationChange2(node,duration);
                                
                                if(button.instances.length > 1)
                                {
                                    //add Node here. 
                                    var i =0;
                                    angular.forEach(button.instances,function(instance)
                                    {
                                        if(i!=0)
                                        {
                                            var newBtnElem = cloneNode({"xml":node,"id":instance.id},xml);
                                            
                                            if(button.actiontype == "time") 
                                            {
                                                
                                                newBtnElem = actionChanger(newBtnElem,actionURLCreator({"id":video.id,"time":hmsToSeconds(instance.action.time)}));
                                                if(i == button.instances.length-1)
                                                    var duration = {"start_time":button.instances[i-1].action.time,"stop_time":video.duration};
                                                else
                                                    var duration = {"start_time":button.instances[i-1].action.time,"stop_time":instance.action.time};
                                            }
                                            else
                                            {
                                                newBtnElem = actionChanger(newBtnElem,instance.action.url);
                                                var duration = {"start_time":instance.duration.start,"stop_time":instance.duration.stop};
                                            }
                                            
                                            newBtnElem = durationChange2(newBtnElem,duration);
                                        }
                                        i++;
                                    });
                                }
                            
                        }
                        else if(idPrefix+button.instances[0].textId == node.attributes.id.value)
                        {
                            // console.log(node);
                            var TEXTNode = node.getElementsByTagName("TEXT");
                            TEXTNode[0].textContent = button.instances[0].text;
                            // console.log(TEXTNode[0].textContent);
                            var new_size = computeTxtSize(button.instances[0].text);
                            node = arrangeAnnotation(node,new_size);
                            
                            if(button.instances.length > 1)
                            {
                                //add Node here. 
                                var i =0;
                                angular.forEach(button.instances,function(instance)
                                {
                                    if(i!=0)
                                    {
                                        var newTxtElem = cloneNode({"xml":node,"id":instance.textId},xml);
                                        
                                        var textNode = newTxtElem.getElementsByTagName("TEXT")[0];
                                        var new_size = computeTxtSize(instance.text);
                                        newTxtElem = arrangeAnnotation(newTxtElem,new_size);
                                        textNode.childNodes[0].data = instance.text;
                                        
                                        var segmentNode = newTxtElem.getElementsByTagName("segment")[0];
                                        segmentNode.setAttribute("spaceRelative",instance.id);
                                        
                                        var triggerNode = newTxtElem.getElementsByTagName("trigger")[0];
                                        var conditionNode = triggerNode.getElementsByTagName("condition")[0];
                                        conditionNode.setAttribute("ref",instance.id);
                                        
                                        
                                        
                                        // console.log(newTxtElem);
                                    }
                                    i++;
                                });
                            }
                        }
                    });
                    
                }            
            });
            */
            // console.log(xml);
            // return xml;
        },
        analyzeIds:function(src,xmlIds,video)
        {
            var finalResult = [];
            //CREATE YOUR OWN ANNOTATION
                
                angular.forEach(xmlIds,function(identifier)
                {
                    // console.log(identifier);
                    var duration = {"start":"","stop":""};
                    finalResult.push({
                        "name":identifier.name,
                        "addable":identifier.addable,
                        "edited":false,
                        "allowEditDuration":"",
                        "actiontype":identifier.actiontype,
                        "pos":identifier.pos,
                        "size":identifier.size,
                        "instances":new Array({
                                                "id":identifier.ids.btn,
                                                "action":"",
                                                "text":identifier.name,
                                                "textId":identifier.ids.text,
                                                "duration":duration,
                                                "editable":false
                                                })
                                    });
                });
                // console.log($rootScope.selected[0]);
                // customizeTemplate(finalResult,xml,$rootScope.selected[0]);
                
                angular.forEach(finalResult,function(button)
                {
                    templateDefaults(button,video);
                });
                
            return {"objects":finalResult,"identifier":""}; 
        },
        checkVideoTemplate:function(xmlIds,video)
        {
            var deferred = $q.defer();
            var url = createURL("http://www.youtube.com/watch",{"v":video.id});
            var count =0;
            var count2 = 0;
            backgroundServices.getAnnotation(url,true).then(function(data)
            {
                var textXML = new XMLSerializer().serializeToString(data);
                angular.forEach(xmlIds,function(identifier)
                {
                    if(identifier.ids.btn != "videobar_channel")
                    {
                        var foundBtnId = false;
                        var foundTxtId = false;
                        if(textXML.match(new RegExp(identifier.ids.btn)))
                        {
                            foundBtnId = true;
                        }
                        if(textXML.match(new RegExp(identifier.ids.text)))
                        {
                            foundTxtId = true;
                        }
                        
                        if(foundBtnId&&foundTxtId)
                        {
                            count++;
                        }
                        count2++;
                    }
                    
                });
                if(count == count2)
                {
                    console.log("template used");
                    deferred.resolve({"templateUsed":true,"xml":data});
                }
                else   
                    deferred.resolve(false);
                
            });
            return deferred.promise;
        },
        getIdPrefix:function()
        {
            return idPrefix;  
        },
        analyzeAnnotations:function(xmlIds,xml)
        {
            // console.log(xml);
            var finalResult= [],buttons=[],text= [];
            angular.forEach(xmlIds,function(identifier)
            {
                angular.forEach(xml.getElementsByTagName("annotations")[0].childNodes,function(node)
                {
                        if(node.nodeName == "annotation")
                        {
                            //JUST GO FOR DEFAULTS THEN SEARCH FOR INSTANCE :(
                            if(node.attributes.id.value == idPrefix+identifier.ids.text)
                            {
                                var textNode = node.getElementsByTagName("TEXT")[0];
                                text.push({"id":identifier.ids.text,"relativeTo":identifier.ids.btn,"msg":textNode.childNodes[0].data});
                            }
                            else if(node.attributes.id.value == idPrefix+identifier.ids.btn)
                            {
                                buttons.push({"name":identifier.name,
                                                "id":identifier.ids.btn,
                                                "action":getAction(node,identifier.actiontype),
                                                "duration":getDuration(node),
                                                "addable":identifier.addable,
                                                "actiontype":identifier.actiontype,
                                                "pos":identifier.pos,
                                                "size":identifier.size,
                                            });
                            }
                        }            
                });
            });
                // console.log(text);
                // console.log(buttons);
                
                angular.forEach(text,function(txt)
                {
                    angular.forEach(buttons,function(btn)
                    {
                        if(btn.id == txt.relativeTo)
                            finalResult.push({"name":btn.name,
                                                "addable":btn.addable,
                                                "actiontype":btn.actiontype,
                                                "edited":true,
                                                "pos":btn.pos,
                                                "size":btn.size,
                                                "instances":new Array({"id":btn.id,"action":btn.action,"text":txt.msg,"textId":txt.id,"duration":btn.duration,"editable":false})});
                    });
                });
                
                // var instances = [];
                angular.forEach(finalResult,function(button)
                {
                    var numbers = [];
                    angular.forEach(xml.getElementsByTagName("annotations")[0].childNodes,function(node)
                    {
                        if(node.nodeName== "annotation")
                        {
                            if(node.attributes.id.value.match(new RegExp(idPrefix+button.instances[0].id+"_([0-9]+)"))!=null)
                            {
                                // console.log(node);
                                // console.log(RegExp.$1);
                                numbers.push(RegExp.$1);
                                // button.instances.push({"id":node.attributes.id.value,"action":getAction(node,button.actiontype),"duration":getDuration(node),"text":"texttry","textId":"asdfasdf"});
                            }
                        }
                    });
                    
                    numbers.sort(function(a,b){return a-b});
                    // console.log(numbers);
                    
                    angular.forEach(numbers,function(number)
                    {
                        angular.forEach(xml.getElementsByTagName("annotations")[0].childNodes,function(node)
                        {
                            if(node.nodeName == "annotation")
                            {
                                if(node.attributes.id.value == idPrefix+button.instances[0].id+"_"+number)
                                {
                                    button.instances.push({"editable":true,"id":idPrefix+button.instances[0].id+"_"+number,"action":getAction(node,button.actiontype),"duration":getDuration(node),"text":"asdfsdf","textId":idPrefix+button.instances[0].textId+"_"+number});
                                }
                            } 
                        });
                    });
                    
                    angular.forEach(button.instances,function(instance)
                    {
                        angular.forEach(xml.getElementsByTagName("annotations")[0].childNodes,function(node)
                        {
                            if(node.nodeName == "annotation")
                            {
                                var segmentNode = node.getElementsByTagName("segment")[0];
                                    
                                try{
                                    if(segmentNode.attributes.spaceRelative.value == instance.id)
                                    {
                                        // console.log(node);
                                        instance.text = node.getElementsByTagName("TEXT")[0].childNodes[0].data;
                                    }
                                }
                                catch(ex)
                                {
                                    
                                }
                            } 
                        });
                    });
                    
                });
                
                console.log(finalResult);
                return {"objects":finalResult};
                // deferred.resolve({"objects":finalResult,"identifier":result.identifier});
        },
        getAnnotationTemplateOnly:function(template,video)
        {
            var optIndex = arguments[2];
            console.log(template);
            var deferred = $q.defer();
            var url = createURL("http://www.youtube.com/watch",{"v":video.id});
            var annot = "<document><annotations></annotations></document>"
            
            
            var annotation = createAnnotations(template.xml_ids);
            
            angular.forEach(annotation.getElementsByTagName("annotations")[0].childNodes,function(node)
            {
                if(node.nodeName == "annotation")
                {
                    angular.forEach(template.xml_ids,function(xml_id)
                    {
                        if(idPrefix+xml_id.ids.btn == node.attributes.id.value)
                        {
                            if(xml_id.addable == true)
                            {
                                //populate
                                var instance = Math.round((hmsToSeconds(video.duration)/2));
                                // console.log(instance);
                                
                                for(i=1;i<=instance;i++)
                                {
                                    if(i!=1)
                                    {
                                        var newBtnElem = cloneNode({"xml":node,"id":idPrefix+xml_id.ids.btn+"_"+i},annotation);
                                        var newTxtElem = cloneNode({"xml":node,"id":idPrefix+xml_id.ids.txt+"_"+i},annotation);
                                    }
                                }
                            }
                        } 
                        else
                        {
                            //text
                        }
                        
                    });
                } 
            });
            // console.log(annotation);
            return annotation;
            // deferred.resolve({"xml":annotation});
            
            // backgroundServices.getAnnotation(url,true).then(function(xml)
            // {
                // var annotXML = textToXML(annot);
                // var count = 0;
                // angular.forEach(xml.getElementsByTagName("annotations")[0].childNodes,function(node)
                // {
                        // if(node.nodeName == "annotation")
                        // {
                            // //JUST GO FOR DEFAULTS THEN SEARCH FOR INSTANCE :(
                            // if(node.attributes.id.value.match(new RegExp("videobar")))
                            // {
                                // count ++;
                                // console.log(node);
                                // var cloneNode = node.cloneNode(true);
                                // var annotationsNode = annotXML.getElementsByTagName("annotations")[0];
                                // annotationsNode.appendChild(cloneNode);
//                                 
//                                 
                            // }
//                           
                        // }            
                // });
                // if(count == 0)
                    // deferred.resolve({"status":false,"index":optIndex,"xml":annotXML});                    
                // else
                    // deferred.resolve({"status":true,"xml":annotXML,"index":optIndex});
            // });
            // return deferred.promise;
        }
    }
    
});

function hmsToSeconds(str)
{
    console.log(str);
    try{
        var p=str.split(':'),
        s=0,m=1;
        while(p.length>0)
        {
            s+=m*parseInt(p.pop(),10);
            m*=60;
        }
        return s;
    }
    catch(err)
    {
        console.log(err);
        return str;
    }
    
}
function secondsToHms(d) 
{
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);
    if(arguments[1] == true)
        return ((h > 0 ? h + "h" : "") + (m > 0 ? (h > 0 && m < 10 ? "0" : "") + m + "m" : "0m") + (s < 10 ? "0" : "") + s)+"s";
    else
        return ((h > 0 ? h + ":" : "") + (m > 0 ? (h > 0 && m < 10 ? "0" : "") + m + ":" : "0:") + (s < 10 ? "0" : "") + s); 
}


