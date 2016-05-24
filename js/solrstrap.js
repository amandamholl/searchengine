

//CONST- CHANGE ALL THESE TO TELL SOLRSTRAP ABOUT THE LOCATION AND STRUCTURE OF YOUR SOLR
var SERVERROOT = 'http://evolvingweb.ca/solr/reuters/select/'; //SELECT endpoint
var HITTITLE = 'title';                                        //Name of the title field- the heading of each hit
var HITBODY = 'text';                                          //Name of the body field- the teaser text of each hit
var HITSPERPAGE = 20;


  function getURL(json,localURL) {
    return json.filter(
        function(json){return json.Filename == localURL}
    );
  }

  String.prototype.capitalize = function() {
      return this.charAt(0).toUpperCase() + this.slice(1);
  }

  $(window).load(function() {
    console.log( "window loaded" );
    if((window.location.href).includes("#")){
      var url = (window.location.href).split("#").join('');
      location.replace(url);
    }
  });

  function checkParams(key){
    var params = getURLParam('q').split(' ');

    var res = false;
    for(var param_key in params){
      if(params[param_key] == key){
        res = true;
        //console.log("match");
      }
    }
    return res;
  }

  function logNewQuery(urlParams){
    console.log(urlParams);
    if(window.sessionStorage.getItem("queries")===null){
      window.sessionStorage.setItem("totalQueries", 1);
      var queries = new Array();
      queries.push({
        query: urlParams,
        clicks:new Array(),
      })
      console.log(queries);
      //queries[window.sessionStorage.setItem("totalQueries") - 1][getURLParam('q')] = new Array();
      window.sessionStorage.setItem("queries",JSON.stringify(queries));
    }
    else{
      window.sessionStorage.setItem("totalQueries", parseInt(window.sessionStorage.getItem("totalQueries"))+1);
      var queries = JSON.parse(window.sessionStorage.getItem("queries"));
      queries.push({
        query: urlParams,
        clicks:new Array(),
      })
      //queries[window.sessionStorage.setItem("totalQueries") - 1][getURLParam('q')] = new Array();
      window.sessionStorage.setItem("queries",JSON.stringify(queries));
    }
  }


//when the page is loaded- do this
  $(document).on('ready',function(event) {
    $('div[offset="0"]').loadSolrResults(getURLParam('q'), Handlebars.compile($("#hit-template").html()), Handlebars.compile($("#result-summary-template").html()), 0);
    event.stopImmediatePropagation();
    $('#searchbox').attr('value', getURLParam('q'));
    $('#enter').attr('value', getURLParam('q'));
    $('#searchbox').focus();
  });

//when the searchbox is typed- do this
  $('#searchbox').keyup(function() {
    if ($(this).val().length > 3) {
      //$('div[offset="0"]').loadSolrResults($(this).val(), Handlebars.compile($("#hit-template").html()), Handlebars.compile($("#result-summary-template").html()), 0);
    }
    else {
      $('#rs').css({ opacity: 0.5 });
    }
  });


  $('#start').on('click', function(){
    if(window.sessionStorage.getItem("start")===null){
      window.sessionStorage.setItem("start",Date());
    }
  });


  //when a facet link is clicked, issue another query
  $(document).on('click','a.facet',function(event){
    event.stopImmediatePropagation();

    if ($('#searchbox').val().length > 3) {
      //strip # if this is at the end of window.location.href
      var url = (window.location.href).split("#").join('');
      if($(this).attr('id') == "c++")
        url = url+"+AND+"+"c%2B%2B";
      else
        url = url+"+AND+"+$(this).attr('id');
      //console.log(url);

      location.replace(url);

      logNewQuery(getURLParam('q')+" AND "+$(this).attr('id'));

      //$('div[offset="0"]').loadSolrResults(($('#searchbox').val()).concat($(this).attr('id')), Handlebars.compile($("#hit-template").html()), Handlebars.compile($("#result-summary-template").html()), 0);
    }
    else {
      $('#rs').css({ opacity: 0.5 });
    }
  });

  //when a link is clicked on, log it
  //use this type of listener so it listens even after links added by handlebars
  $(document).on('click','a.result',function(event){
    event.stopImmediatePropagation();
    var queries = JSON.parse(window.sessionStorage.getItem("queries"));

    console.log(queries[window.sessionStorage.getItem("totalQueries") - 1]);
    queries[window.sessionStorage.getItem("totalQueries") - 1]['clicks'].push($(this).attr('href'));
    window.sessionStorage.setItem("queries", JSON.stringify(queries));
    console.log(queries);

    if(window.sessionStorage.getItem("totalClicks")===null){
      window.sessionStorage.setItem("totalClicks",1);
    }
    else {
      window.sessionStorage.setItem("totalClicks",parseInt(window.sessionStorage.getItem("totalClicks"))+1);
    }
  });

  $("#searchbox").keyup(function(event){
    if(event.keyCode == 13){
      logNewQuery(getURLParam('q'));
    }
    //console.log(window.sessionStorage.getItem("clicks") );
  });

  $("#end").click(function(){
    window.sessionStorage.setItem("end",Date());
    console.log(window.sessionStorage);

    // Build nice looking session object
    var sessionLog = new Object();
    sessionLog.startedAt = window.sessionStorage.getItem("start");
    sessionLog.endedAt = window.sessionStorage.getItem("end");
    sessionLog.duration = ((new Date(sessionLog.endedAt)).getTime() - (new Date(sessionLog.startedAt)).getTime())/1000;
    sessionLog.queries = JSON.parse(window.sessionStorage.getItem("queries"));
    sessionLog.totalClicks = window.sessionStorage.getItem("totalClicks");
    sessionLog.totalQueries = window.sessionStorage.getItem("totalQueries");

    //begin building session data to log
    var url = 'data:text/json;charset=utf8,' + encodeURIComponent(JSON.stringify(sessionLog));
    window.open(url, '_blank');
    window.focus();
    window.sessionStorage.clear();
  });

  //jquery plugin allows resultsets to be painted onto any div.
  (function( $ ){
    $.fn.loadSolrResults = function(q, hitTemplate, summaryTemplate, offset) {

      $(this).getSolrResults(q, hitTemplate, summaryTemplate, offset);
    };
  })( jQuery );


  //jquery plugin allows autoloading of next results when scrolling.
  (function( $ ){
    $.fn.loadSolrResultsWhenVisible = function(q, hitTemplate, summaryTemplate, offset) {
      elem = this;
      $(window).scroll(function(event){
        if (isScrolledIntoView(elem) && !$(elem).attr('loaded')) {
          //dont instantsearch and autoload at the same time
          if ($('#searchbox').val() != getURLParam('q')) {
            window.location = 'results.html?q=' + $('#searchbox').val();
          }
          $(elem).attr('loaded', true);
          $(elem).getSolrResults(q, hitTemplate, summaryTemplate, offset);
          $(window).unbind('scroll');
        }
      });
    };
  })( jQuery );



  //jquery plugin for takling to solr
  (function( $ ){
    $.fn.getSolrResults = function(q, hitTemplate, summaryTemplate, offset) {
      var rs = this;
      console.log('here');
      $(rs).parent().css({ opacity: 0.5 });
      $.ajax({
        url : 'http://localhost:8983/solr/files/select?q='+q+'&wt=json&facet=true&facet.query=c&facet.query=c%2B%2B&facet.query=html&facet.query=java&facet.query=javascript&facet.query=jquery&facet.query=php&facet.query=python&facet.query=ruby&facet.query=interview&facet.query=homework&facet.query=examples&facet.query=tutorial&facet.query=reference',
        type: "GET",
        dataType: "jsonp",
        jsonp : 'json.wrf',
        //jsonpCallback: "callback",
        data:{
          //q:q,
          //wt:"json",
          //fl:"content, title,id",
          hl:true,
          'hl.snippets':5,
          'hl.fl':"*",
          'hl.usePhraseHighlighter':true,
          'start': offset,

          //&hl.snippets=20&hl.fl=content&hl.usePhraseHighlighter=true
          //http://localhost:8983/solr/techproducts/select?q=inStock:false&wt=json&fl=id,name

      },
      success: function(result) {
        console.log(result);
        $("ul.nav-sidebar").empty();
        if(getURLParam('q')!="")
          $("ul.languages").append("<li class='header'><a style='color:black'>Languages</a></li>");
        var facetTemplate = Handlebars.compile($("#facet-template").html());
        for(var key in result.facet_counts.facet_queries){

          //look at exact matches

          if(getURLParam('q')!="" && !(checkParams(key))){
            if("php jquery javascript css html java python c ruby c++".includes(key))
              $("ul.languages").append(facetTemplate({facet:key,title:key,count:result.facet_counts.facet_queries[key]}));
            else if("tutorial examples reference".includes(key))
              $("ul.tutorials-ex-reference").append(facetTemplate({facet:key,title:key.capitalize(),count:result.facet_counts.facet_queries[key]}));
            else if("interview" == key)
              $("ul.interview").append(facetTemplate({facet:key,title:key.capitalize(),count:result.facet_counts.facet_queries[key]}));
            else if("homework" == key)
              $("ul.homework").append(facetTemplate({facet:key,title:key.capitalize(),count:result.facet_counts.facet_queries[key]}));
          }

        }

        var docs = JSON.stringify(result.highlighting);
        var jsonData = JSON.parse(docs);
        if (result.response.docs.length > 0) {
          if (offset == 0) {
            rs.empty();
            rs.append(summaryTemplate({totalresults: result.response.numFound, query: q}));
            rs.siblings().remove();
          }
          $.getJSON("./File_URL_Pairs.json", function(json) {
            for (var i = 0; i < result.response.docs.length; i++) {
              //console.log(result.response.docs[i]["id"]);
              var text;
              var highlightedContent = result.highlighting[result.response.docs[i]["id"]]["content"];
              var highlightedCode = result.highlighting[result.response.docs[i]["id"]]["attr_text_html"];
              var highlightedDesc = result.highlighting[result.response.docs[i]["id"]]["attr_description"];
              if(highlightedContent){
                //escape any unsafe html
                text = highlightedContent.join('').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
                //add back in the strong tags
                text = text.replace(/&lt;strong&gt;/g,"<strong>").replace(/&lt;\/strong&gt;/g,"</strong>");
              }
              else if(!highlightedContent && highlightedCode){
                //console.log(highlightedCode);
                //merge but then remove html characters so its rendered as a string and not html code
                //remove any unsafe html(escape the string)
                text = highlightedCode.join('').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
                //add back in the strong tags
                text = text.replace(/&lt;strong&gt;/g,"<strong>").replace(/&lt;\/strong&gt;/g,"</strong>");
              }
              else{
                //text = (result.highlighting[result.response.docs[i]["id"]]["content"])
                //escape any unsafe html
                text = highlightedDesc.join('').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
                //add back in the strong tags
                text = text.replace(/&lt;strong&gt;/g,"<strong>").replace(/&lt;\/strong&gt;/g,"</strong>");
              }

              var parseURL = result.response.docs[i]["id"].split("/");
              var found = getURL(json,parseURL[parseURL.length-1]);
              //console.log(parseURL[parseURL.length-1].replace('.','').replace('.','').replace('.',''));
              var id = parseURL[parseURL.length-1].replace('.','').replace('.','').replace('.','');
              rs.append(hitTemplate({id:id,url:found[0].URL,title: result.response.docs[i]["title"], text: text}));

              var config = liquidFillGaugeDefaultSettings();
              config.textVertPosition = 0.8;
              //config.waveAnimateTime = 5000;
              config.waveHeight = 0;
              //config.waveAnimate = false;
              //config.waveOffset = 0.25;
              config.valueCountUp = false;
              config.displayPercent = false;
              if(result.response.docs[i]["attr_text_html"]){
                var code = 0;
                for(var j=0; j < result.response.docs[i]["attr_text_html"].length; j++){
                  code += result.response.docs[i]["attr_text_html"][j].length;
                }
              }
              else {
                var code = 0;
              }
              var gauge1 = loadLiquidFillGauge(id, (code/(code+result.response.docs[i]["content"].length)) * 100, config);
            }
          }).error(function(error){console.log(error);});
          $(rs).parent().css({ opacity: 1 });
          //if more results to come- set up the autoload div
          if ((+HITSPERPAGE+offset) < +result.response.numFound) {
            var nextDiv = document.createElement('div');
            $(nextDiv).attr('offset', +HITSPERPAGE+offset);
            rs.parent().append(nextDiv);
            $(nextDiv).loadSolrResultsWhenVisible(q, hitTemplate, summaryTemplate, +HITSPERPAGE+offset);
          }
        }
        else{
          rs.append("<p> No results found. Please try another query. </p>.");
        }
      },
      error: function(result) { console.log("Error"); },

      });
    };
  })( jQuery );


  //utility function for grabbling URLs
  function getURLParam(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.search);
    if(results == null)
      return "";
    else
      return decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  //utility function that checks to see if an element is onscreen
  function isScrolledIntoView(elem) {
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();
    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(elem).height();
    return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
  }
