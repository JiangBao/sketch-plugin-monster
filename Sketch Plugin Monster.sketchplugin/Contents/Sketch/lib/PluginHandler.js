@import 'utils.js';

function PluginHandler() {
  var pluginPath = '/Library/Application Support/com.bohemiancoding.sketch3/Plugins';
  this.path = utils.path.join(NSHomeDirectory(), pluginPath);
}

PluginHandler.prototype.getPluginList = function () {
  return utils.fs.readdir(this.path);
};

PluginHandler.prototype.getManifestPathOfPlugin = function (name) {
  var basicPath = utils.path.join(this.path, name);
  var filesInBasicPath = utils.fs.readdir(basicPath);
  var targetPath;

  utils.array.forEach(filesInBasicPath, function (item) {
    var r = false;

    if (/\.sketchplugin$/.test(item)) {
      targetPath = item;
      r = true;
    }

    return r;
  });

  return utils.path.join(this.path, name, targetPath, '/Contents/Sketch/manifest.json');
};

PluginHandler.prototype.getManifestOfPlugin = function (name) {
  var confFileData = utils.fs.readFile(this.getManifestPathOfPlugin(name));
  var configurations = utils.JSON.parse(confFileData);

  return configurations;
};

PluginHandler.prototype.getCommandsOfAllPlugins = function () {
  var pluginList = this.getPluginList();
  var commandList = [];
  var _self = this;

  utils.array.forEach(pluginList, function (item) {
    var manifest = _self.getManifestOfPlugin(item);
    commandList.push({
      name: String(item),
      commands: utils.array.filter(manifest.commands, function (item) {
        return manifest.menu && manifest.menu.items && manifest.menu.items.indexOf(item.identifier) > -1;
      })
    });
  });

  return commandList;
};

PluginHandler.prototype.setShortcutForPlugin = function (name, replacement) {
  var originalConfigurations = this.getManifestOfPlugin(name);
  var confFilePath = this.getManifestPathOfPlugin(name);
  var confFileData;
  var result = false;

  utils.array.forEach(originalConfigurations.commands, function (item, i) {
    if (item.identifier == replacement.identifier) {
      if (replacement.shortcut) {
        // change shortcut
        originalConfigurations.commands[i].shortcut = replacement.shortcut;
      } else {
        // empty shortcut
        delete originalConfigurations.commands[i].shortcut;
      }

      // write configurations
      confFileData = utils.JSON.stringify(originalConfigurations);
      utils.fs.writeFile(confFilePath, confFileData);
      result = true;
    }

    return result;
  });

  return result;
};