var Vehicles = new Mongo.Collection('vehicles');

if (Meteor.isClient) {
  var map;
  var markers = {};

  Template.map.onRendered(function() {
    L.mapbox.accessToken = 'pk.eyJ1Ijoic2hheWRpbiIsImEiOiJ5bjlwZG13In0.rwK-AZ7EcV0oD7LeflmKKg';
    map = L.mapbox.map('map', 'mapbox.streets', { center: [38.8953, -77.0255], zoom: 13 });
  });

  Vehicles.find().observeChanges({
    added: function(id, fields) {
      var marker = L.marker([fields.lat, fields.lon]);
      markers[id.toString()] = marker;
      marker.addTo(map);
    },
    changed: function(id, fields) {
      var marker = markers[id.toString()];
      if (_.isUndefined(marker)) {
        marker = L.marker([fields.lat, fields.lon]);
        markers[id.toString()] = marker;
        marker.addTo(map);
      } else {
        marker.setLatLng([fields.lat, fields.lon]);
      }
    },
    removed: function(id) {
      var marker = markers[id.toString()];
      if (!_.isUndefined(marker)) {
        map.removeLayer(marker);
      }
    }
  });

}

if (Meteor.isServer) {
 var refreshData = function() {
    HTTP.call('GET', 'https://publicdata-transit.firebaseio.com/dc-circulator.json', function(error, result) {
      var vehicles = result.data.vehicles;
      _.each(vehicles, function(vehicle) {
        Vehicles.upsert({id: vehicle.id}, { $set: {
            lat: vehicle.lat, lon: vehicle.lon, heading: vehicle.heading, route: vehicle.routeTag
          }
        });
      });
    });
  };

  Meteor.startup(function() {
    Meteor.setInterval(refreshData, 30000);
  });
}
