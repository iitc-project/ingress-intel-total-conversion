ingress intel total conversion mobile (IITCM)
=====================================

The Android App behaves like the desktop version, but uses the mobile view, which is optimized for mobile devices, as default. Furthermore, there are some nice additions:

- it should be much faster than the standard mobile ingress intel map

- plugin support

- show users current location

- a geo intent is sent, when a portals Map link is clicked (lets you navigate to portals)

- a geolocate button (you have to enable GPS satellites + location access to use this feature)

- possibility to use a custom IITC script source

- a click on Portal link copies it to clipboard

- in-app layer chooser

- in-app IITC buttons

- in-app search

- support for unofficial plugins. Just copy the *.user.js files to ```<storage_path>/IITC_Mobile/plugins/``` and they should appear at the end of the plugin list. Note: For every option a new persistent database entry is created. If you want to remove a plugin from your external storage you want to ensure that it is disabled in the settings, otherwise IITCM will always try to load it on start-up. If you messed this up you can wipe app data or add the plugin back to storage, disable it and remove it. Another option would be: Do nothing...it should work even so.

- developer mode: all script source will be loaded from ```<storage_path>/IITC_Mobile/dev/```

- more features will be added soon...

**The App only works with Android 4.0+**

### [For developer docs, please see HACKING.md](https://github.com/jonatkins/ingress-intel-total-conversion/blob/master/mobile/HACKING.md)
