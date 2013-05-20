ingress intel total conversion mobile (IITCM)
=====================================

The Android App behaves like the desktop version, but uses the mobile view, which is optimized for mobile devices, as default. Furthermore, there are some nice additions:

- it should be much faster than the standard mobile ingress intel map

- plugin support

- support for unofficial plugins. just copy the *.user.js file to ```<storage_path>/IITC_Mobile/plugins/``` and they should be parsed on start-up

- in-app layer chooser

- in-app IITC buttons

- show users current location

- a geo intent is sent, when a portals Map link is clicked (lets you navigate to portals)

- a geolocate button (you have to enable GPS satellites + location access to use this feature)

- possibility to use a custom IITC script source

- a click on Portal link copies it to clipboard

- developer mode: all script source will be loaded from ```<storage_path>/IITC_Mobile/dev/```

- more features will be added soon...

**The App only works with Android 4.0+**

### [For developer docs, please see HACKING.md](https://github.com/jonatkins/ingress-intel-total-conversion/blob/master/mobile/HACKING.md)
