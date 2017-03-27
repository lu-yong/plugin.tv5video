/**
 * Showtime plugin to watch TV5Canada replay TV 
 *
 * Copyright (C) 2013-2015 Anthony Dahanne
 *
 *     This file is part of TV5Video.ca Showtime plugin.
 *
 *  TV5Video.ca Showtime plugin is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  TV5Video.ca Showtime plugin is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TV5Video.ca Showtime plugin.  If not, see <http://www.gnu.org/licenses/>.
 *
 *  Download from : https://github.com/anthonydahanne/showtime-plugin-tv5video.ca
 *
 */

(function(plugin) {

  var PLUGIN_PREFIX = "tv5video.ca:";
  var EMISSIONS_URL = "http://m.video.tv5.ca/api/json/application/a_z";
  var EPISODES_URL =  "http://m.video.tv5.ca/api/json/tools/loadSerieEmissions";
 
  // Register a service (will appear on home page)
  var service = plugin.createService("TV5Video.ca", PLUGIN_PREFIX+"start", "tv", true, plugin.path + "tv5video.png");

   // Add a responder to the registered start URI
  plugin.addURI(PLUGIN_PREFIX+"start", function(page) {
    page.type = "directory";
    page.metadata.title = "TV5Video.ca shows";

    showtime.trace("!!Getting emissions list : " + EMISSIONS_URL);
    var getEmissionsResponse = showtime.httpGet(EMISSIONS_URL);
    showtime.trace("!!Getting episodes list finally");
    var emissions = showtime.JSONDecode(getEmissionsResponse);
    showtime.trace("list json pase ok");

    var allTitles = emissions.data;
    for (var show in allTitles){
      var index;
	  for (index = 0; index < allTitles[show].length; ++index) {
		  var season = "";
		  if(allTitles[show][index]["_meta"]["saison"] !== "") {
			  season = " Saison " + allTitles[show][index]["_meta"]["saison"];
		  }
          page.appendItem(PLUGIN_PREFIX+"emission:"+allTitles[show][index]["id"]+":"+allTitles[show][index]["title"] + season, "directory", {
          title: allTitles[show][index]["title"] + season
   	    });
   	  }
    }
    page.loading = false;
  });

  // Add a responder to the registered emission URI
  plugin.addURI(PLUGIN_PREFIX+"emission:(.*):(.*)", function(page,emissionId,title) {
    page.type = "directory";
    page.metadata.title = title;

    showtime.trace("Getting episodes list : " + EPISODES_URL + " " + emissionId);
	var objectData = {"parameters" : "{\"id\":" + emissionId + ",\"pagesize\":\"16\",\"page\":1}"}
	var getEpisodesResponse = showtime.httpReq(EPISODES_URL, {
      postdata: objectData
    });
    showtime.trace("Getting episodes list finally");

    var episodes = showtime.JSONDecode(getEpisodesResponse);
	
    var allInfo = episodes.resultset;
    var index;
    for (index = 0; index < allInfo.length; ++index) {
      var episode = allInfo[index];
      var publish_end = "Disponible jusqu'à : " + episode["publish_end"] +"\n\n";		
      var metadata = {
        title: episode["title"],
        description: publish_end + episode["excerpt"],
        year: parseInt(episode["_meta"]["annee_production"]),
        duration: episode["_meta"]["duree"],
        icon: episode["_documents"][0]["sizes"]["large"]
      };
      page.appendItem(PLUGIN_PREFIX + "video:" + episode["_documents"][0]["_meta"]["url_m3u8"]
          + ":title:" + metadata.title + ":icon:" + metadata.icon + ":des:" + metadata.description, "directory", metadata);
    }

    page.loading = false;
  });

  plugin.addURI(PLUGIN_PREFIX+"video:(.*):title:(.*):icon:(.*):des:(.*)", function(page, pid, title, icon, des) {
      page.appendItem(PLUGIN_PREFIX + "play:" + pid, "video", {
        title: title,
        icon: icon,
        description: des
      });
    page.loading = false;
  });

  plugin.addURI(PLUGIN_PREFIX+"play:(.*)", function(page, pid) {
    var videoParams = {
        sources: [{
                url: pid,
                mimetype: "xx",    
          }],
        no_subtitle_scan: true,
        subtitles: []      
      }
    page.source = 'videoparams:' + JSON.stringify(videoParams);
  });
})(this);
