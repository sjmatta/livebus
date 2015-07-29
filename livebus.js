var Vehicles = new Mongo.Collection('vehicles');

if (Meteor.isClient) {
  var map;
  var markers = {};

  L.RotatedMarker = L.Marker.extend({
    options: { angle: 0 },
    _setPos: function(pos) {
      L.Marker.prototype._setPos.call(this, pos);
      this._icon.style[L.DomUtil.TRANSFORM] += ' rotate(' + this.options.angle + 'deg)';
    }
  });

  L.rotatedMarker = function(pos, options) {
      return new L.RotatedMarker(pos, options);
  };

  Template.map.onRendered(function() {
    L.mapbox.accessToken = 'pk.eyJ1Ijoic2hheWRpbiIsImEiOiJ5bjlwZG13In0.rwK-AZ7EcV0oD7LeflmKKg';
    map = L.mapbox.map('map', 'mapbox.streets', { center: [38.8953, -77.0255], zoom: 13 });

    Vehicles.find().observeChanges({
      added: function(id, fields) {
        if (_.isUndefined(fields.lat) || _.isUndefined(fields.lon) || _.isNaN(fields.lat) || _.isNaN(fields.lon))
          return;
        try {
          var marker = L.rotatedMarker([fields.lat, fields.lon], {
            icon: L.divIcon({
              className: 'bus',
              iconSize: [35, 35]
            })
          });
          marker.options.angle = (fields.heading - 90) % 360;
          markers[id.toString()] = marker;
          marker.addTo(map);
        } catch(err) {
          console.log(err);
          console.log(fields);
        }
      },
      changed: function(id, fields) {
        if (_.isUndefined(fields.lat) || _.isUndefined(fields.lon) || _.isNaN(fields.lat) || _.isNaN(fields.lon))
          return;
        try {
          var marker = markers[id.toString()];
          if (_.isUndefined(marker)) {
            marker = L.rotatedMarker([fields.lat, fields.lon], {
              icon: L.divIcon({
                className: 'bus, leaflet-zoom-hide',
                iconSize: [35, 35]
              })
            });
            markers[id.toString()] = marker;
            marker.addTo(map);
          } else {
            marker.setLatLng([fields.lat, fields.lon]);
          }
          marker.options.angle = (fields.heading - 90) % 360;
        } catch(err) {
          console.log(err);
          console.log(fields);
        }
      },
      removed: function(id) {
        var marker = markers[id.toString()];
        if (!_.isUndefined(marker)) {
          map.removeLayer(marker);
        }
      }
    });
  });
}

if (Meteor.isServer) {
  var addVehicle = Meteor.bindEnvironment(function(vehicle) {
      Vehicles.upsert({ id: vehicle.val().id }, { $set: { lat: vehicle.val().lat, lon: vehicle.val().lon, heading: vehicle.val().heading }});
  });

  var transitRef = new Firebase('https://publicdata-transit.firebaseio.com/dc-circulator/vehicles');
  transitRef.on('child_changed', addVehicle);
}
