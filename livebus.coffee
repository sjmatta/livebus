Vehicles = new Mongo.Collection 'vehicles'

if Meteor.isClient
  markers = {}

  L.RotatedMarker = L.Marker.extend
    options: 
      angle: 0
    _setPos: (pos) ->
      L.Marker.prototype._setPos.call(this, pos)
      this._icon.style[L.DomUtil.TRANSFORM] += ' rotate(' + this.options.angle + 'deg)'

  L.rotatedMarker = (pos, options) -> new L.RotatedMarker pos, options

  Template.map.onRendered () ->
    L.mapbox.accessToken = 'pk.eyJ1Ijoic2hheWRpbiIsImEiOiJ5bjlwZG13In0.rwK-AZ7EcV0oD7LeflmKKg'
    map = L.mapbox.map 'map', 'mapbox.streets', { center: [38.8953, -77.0255], zoom: 13 }

    Vehicles.find().observeChanges
      added: (id, fields) ->
        return if not fields.lat? or not fields.lon?
        try
          marker = L.rotatedMarker [fields.lat, fields.lon], 
            icon: L.divIcon
              className: 'bus'
              iconSize: [35, 35]
          marker.options.angle = (fields.heading - 90) % 360
          markers[id.toString()] = marker
          marker.addTo map
        catch err
          console.log err
          console.log fields

      changed: (id, fields) ->
        marker = markers[id.toString()]
        return if not fields.lat? or not fields.lon? or not marker?
        try
          marker.setLatLng [fields.lat, fields.lon]
          marker.options.angle = (fields.heading - 90) % 360
        catch err
          console.log err
          console.log fields

      removed: (id) ->
        marker = markers[id.toString()];
        map.removeLayer marker if marker?


if Meteor.isServer
  addVehicle = Meteor.bindEnvironment (vehicle) ->
      Vehicles.upsert {id: vehicle.val().id},
        $set: 
          lat: vehicle.val().lat
          lon: vehicle.val().lon
          heading: vehicle.val().heading

  transitRef = new Firebase 'https://publicdata-transit.firebaseio.com/dc-circulator/vehicles'
  transitRef.on 'child_changed', addVehicle