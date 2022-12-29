// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import * as ejs from 'ejs';
import { BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { ThemedWindow } from '../dialog/themedwindow';
import { FrontEndMode, ThemeType } from '../settings';
import { getBundledPythonPath } from '../utils';

export class PreferencesDialog {
  constructor(options: PreferencesDialog.IOptions) {
    this._window = new ThemedWindow({
      title: 'Preferences',
      width: 700,
      height: 400,
      preload: path.join(__dirname, './preload.js')
    });

    const {
      theme,
      syncJupyterLabTheme,
      showNewsFeed,
      frontEndMode,
      checkForUpdatesAutomatically,
      defaultWorkingDirectory
    } = options;
    const installUpdatesAutomaticallyEnabled = process.platform === 'darwin';
    const installUpdatesAutomatically =
      installUpdatesAutomaticallyEnabled && options.installUpdatesAutomatically;
    let defaultPythonPath = options.defaultPythonPath;
    const bundledPythonPath = getBundledPythonPath();

    if (defaultPythonPath === '') {
      defaultPythonPath = bundledPythonPath;
    }
    let bundledEnvExists = false;
    try {
      bundledEnvExists = fs.existsSync(bundledPythonPath);
    } catch (error) {
      console.error('Failed to check for bundled Python path', error);
    }

    const selectBundledPythonPath =
      (defaultPythonPath === '' || defaultPythonPath === bundledPythonPath) &&
      bundledEnvExists;

    if (bundledEnvExists) {
      // TODO: check if latest
    }

    const template = `
      <style>
      #container {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      #content-area {
        display: flex;
        flex-direction: row;
        column-gap: 20px;
        flex-grow: 1;
        overflow-y: auto;
      }
      #categories {
        width: 200px;
      }
      #category-content-container {
        flex-grow: 1;
      }
      .category-content {
        display: flex;
        flex-direction: column;
      }
      #footer {
        text-align: right;
      }
      #category-jupyterlab jp-divider {
        margin: 15px 0;
      }
      #server-config-section {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      }
      jp-tab-panel #tab-updates {
        display: flex;
        align-items: flex-start;
      }
      #category-tabs {
        width: 100%;
      }
      #bundled-env-warning {
        display: none;
        align-items: center;
      }
      #bundled-env-warning.warning {
        color: orange;
      }
      #install-bundled-env {
        display: none;
      }
      #update-bundled-env {
        display: none;
      }
      .row {
        display: flex;
        align-items: center;
      }
      .footer-row {
        height: 50px;
        overflow-y: hidden;
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        align-items: center;
      }
      .progress-message {
        margin-right: 5px; line-height: 24px; visibility: hidden;
      }
      .progress-animation {
        margin-right: 5px; visibility: hidden;
      }
      #news-feed-settings {
        display: flex;
        flex-direction: column;
        margin: 10px 0;
      }
      </style>
      <div id="container">
        <div id="content-area">
          <jp-tabs id="category-tabs" false="" orientation="vertical">
            <jp-tab id="tab-appearance">
              Appearance
            </jp-tab>
            <jp-tab id="tab-local-server">
              Local Server
            </jp-tab>
            <jp-tab id="tab-updates">
              Updates
            </jp-tab>
          
            <jp-tab-panel id="tab-appearance">
              <jp-radio-group orientation="horizontal">
                <label slot="label">Theme</label>
                <jp-radio name="theme" value="light" <%= theme === 'light' ? 'checked' : '' %>>Light</jp-radio>
                <jp-radio name="theme" value="dark" <%= theme === 'dark' ? 'checked' : '' %>>Dark</jp-radio>
                <jp-radio name="theme" value="system" <%= theme === 'system' ? 'checked' : '' %>>System</jp-radio>
              </jp-radio-group>
              <jp-checkbox id='checkbox-sync-jupyterlab-theme' type='checkbox' <%= syncJupyterLabTheme ? 'checked' : '' %>>Sync JupyterLab theme</jp-checkbox>

              <div id="news-feed-settings">
                <label slot="label">News Feed</label>
                <jp-checkbox id='checkbox-show-news-feed' type='checkbox' <%= showNewsFeed ? 'checked' : '' %> onchange='handleAutoCheckForUpdates(this);'>Show news feed on welcome page</jp-checkbox>
              </div>

              <jp-radio-group orientation="horizontal">
                <label slot="label">JupyterLab UI mode</label>
                <jp-radio name="frontend-mode" value="web-app" <%= frontEndMode === 'web-app' ? 'checked' : '' %> title="Use the server supplied web application as JupyterLab UI">Web app</jp-radio>
                <jp-radio name="frontend-mode" value="client-app" <%= frontEndMode === 'client-app' ? 'checked' : '' %> title="Use the bundled client application as JupyterLab UI">Client app</jp-radio>
              </jp-radio-group>

              <script>
              const syncJupyterLabThemeCheckbox = document.getElementById('checkbox-sync-jupyterlab-theme');
              </script>
            </jp-tab-panel>

            <jp-tab-panel id="tab-local-server">
              <div class="row" style="line-height: 30px;">
                <b>Default Working Directory</b>
              </div>
              <div class="row">
                <div style="flex-grow: 1;">
                  <jp-text-field type="text" id="working-directory" value="<%= defaultWorkingDirectory %>" style="width: 100%;" spellcheck="false"></jp-text-field>
                </div>
                <div>
                  <jp-button id='select-working-directory' onclick='handleSelectWorkingDirectory(this);'>Change</jp-button>
                </div>
              </div>

              <div id="content-local-server" class="server-type-content">
                <div class="row" style="line-height: 30px;">
                  <b>Default Python Environment</b>
                </div>
                <div style="display: flex; flex-direction: column; row-gap: 5px;">
                  <div id="bundled-env-warning"><span id="bundled-env-warning-message"></span><jp-button id='install-bundled-env' onclick='handleInstallBundledEv(this);'>Install</jp-button><jp-button id='update-bundled-env' onclick='handleUpdateBundledEv(this);'>Update</jp-button></div>
                  <jp-radio-group orientation="vertical">
                    <jp-radio type="radio" id="bundled-env" name="env_type" value="bundled-env" <%= selectBundledPythonPath ? 'checked' : '' %> <%= !bundledEnvExists ? 'disabled' : '' %> onchange="handleEnvTypeChange(this);">Bundled Python environment</jp-radio>
                    <jp-radio type="radio" id="custom-env" name="env_type" value="custom-env" <%= !selectBundledPythonPath ? 'checked' : '' %> onchange="handleEnvTypeChange(this);">Custom Python environment</jp-radio>
                  </jp-radio-group>

                  <div class="row">
                    <div style="flex-grow: 1;">
                      <jp-text-field type="text" id="python-path" value="<%= defaultPythonPath %>" style="width: 100%;" spellcheck="false"></jp-text-field>
                    </div>
                    <div>
                      <jp-button id='select-python-path' onclick='handleSelectPythonPath(this);'>Select Python path</jp-button>
                    </div>
                  </div>
                </div>
              </div>

              <script>
              const workingDirectoryInput = document.getElementById('working-directory');
              const bundledEnvRadio = document.getElementById('bundled-env');
              const customEnvRadio = document.getElementById('custom-env');
              const pythonPathInput = document.getElementById('python-path');
              const selectPythonPathButton = document.getElementById('select-python-path');
              const bundledEnvWarningContainer = document.getElementById('bundled-env-warning');
              const bundledEnvWarningMessage = document.getElementById('bundled-env-warning-message');
              const installBundledEnvButton = document.getElementById('install-bundled-env');
              const updateBundledEnvButton = document.getElementById('update-bundled-env');

              function handleSelectWorkingDirectory(el) {
                window.electronAPI.selectWorkingDirectory();
              }

              function handleEnvTypeChange() {
                defaultPythonEnvChanged = true;
                const useBundledEnv = bundledEnvRadio.checked;
                if (useBundledEnv) {
                  pythonPathInput.setAttribute('disabled', 'disabled');
                  selectPythonPathButton.setAttribute('disabled', 'disabled');
                } else {
                  pythonPathInput.removeAttribute('disabled');
                  selectPythonPathButton.removeAttribute('disabled');
                }
              }

              function handleSelectPythonPath(el) {
                window.electronAPI.selectPythonPath();
              }

              function showBundledEnvWarning(type) {
                if (type === 'does-not-exist') {
                  bundledEnvWarningMessage.innerText = 'Bundled environment not found. Install now.';
                  installBundledEnvButton.style.display = 'block';
                  bundledEnvWarningContainer.classList.add('warning');
                } else {
                  bundledEnvWarningMessage.innerText = 'There is a newer bundled environment available. Update now.';
                  updateBundledEnvButton.style.display = 'block';
                }
                bundledEnvWarningContainer.style.display = 'flex';
              }

              function hideBundledEnvWarning() {
                bundledEnvWarningContainer.style.display = 'none';
              }

              function handleInstallBundledEv() {
                showProgress('Installing environment', true);
                applyButton.setAttribute('disabled', 'disabled');
                installBundledEnvButton.setAttribute('disabled', 'disabled');
                window.electronAPI.installBundledPythonEnv();
              }

              function handleUpdateBundledEv() {
                showProgress('Updating environment', true);
                applyButton.setAttribute('disabled', 'disabled');
                window.electronAPI.updateBundledPythonEnv();
              }

              window.electronAPI.onInstallBundledPythonEnvResult((result) => {
                const message = result === 'CANCELLED' ?
                  'Installation cancelled!' :
                  result === 'FAILURE' ?
                    'Failed to install the environment!' : 'Installation succeeded';
                showProgress(message, false);

                if (result === 'SUCCESS') {
                  bundledEnvRadio.removeAttribute('disabled');
                  hideBundledEnvWarning();
                }

                installBundledEnvButton.removeAttribute('disabled');
                applyButton.removeAttribute('disabled');
              });

              window.electronAPI.onWorkingDirectorySelected((path) => {
                workingDirectoryInput.value = path;
              });

              window.electronAPI.onCustomPythonPathSelected((path) => {
                pythonPathInput.value = path;
              });

              handleEnvTypeChange();
              <%- !bundledEnvExists ? 'showBundledEnvWarning("does-not-exist");' : '' %> 
              </script>
            </jp-tab-panel>

            <jp-tab-panel id="tab-updates">
              <jp-checkbox id='checkbox-update-check' type='checkbox' <%= checkForUpdatesAutomatically ? 'checked' : '' %> onchange='handleAutoCheckForUpdates(this);'>Check for updates automatically</jp-checkbox>
              <jp-checkbox id='checkbox-update-install' type='checkbox' <%= installUpdatesAutomatically ? 'checked' : '' %> <%= installUpdatesAutomaticallyEnabled ? '' : 'disabled' %>>Download and install updates automatically</jp-checkbox>

              <jp-button onclick='handleCheckForUpdates(this);'>Check now</jp-button>
              <script>
                const autoUpdateCheckCheckbox = document.getElementById('checkbox-update-check');
                const autoInstallCheckbox = document.getElementById('checkbox-update-install');

                function handleAutoCheckForUpdates(el) {
                  updateAutoInstallCheckboxState();
                }

                function updateAutoInstallCheckboxState() {
                  if (<%= installUpdatesAutomaticallyEnabled ? 'true' : 'false' %> /* installUpdatesAutomaticallyEnabled */ &&
                    autoUpdateCheckCheckbox.checked) {
                    autoInstallCheckbox.removeAttribute('disabled');
                  } else {
                    autoInstallCheckbox.setAttribute('disabled', 'disabled');
                  }
                }

                function handleCheckForUpdates(el) {
                  window.electronAPI.checkForUpdates();
                }

                document.addEventListener("DOMContentLoaded", () => {
                  updateAutoInstallCheckboxState();
                });
              </script>
            </jp-tab-panel>
          </jp-tabs>
        </div>
        <div id="footer" class="footer-row">
          <div id="progress-message" class="progress-message"></div>
          <div id="progress-animation" class="progress-animation"><jp-progress-ring></jp-progress-ring></div>
          <jp-button id="apply" appearance="accent" onclick='handleApply(this);'>Apply & restart</jp-button>
        </div>
      </div>
      <script>
        const applyButton = document.getElementById('apply');
        const progressMessage = document.getElementById('progress-message');
        const progressAnimation = document.getElementById('progress-animation');
        let defaultPythonEnvChanged = false;

        function showProgress(message, animate) {
          progressMessage.innerText = message;
          progressMessage.style.visibility = message !== '' ? 'visible' : 'hidden';
          progressAnimation.style.visibility = animate ? 'visible' : 'hidden';
        }

        function handleApply() {
          const theme = document.querySelector('jp-radio[name="theme"].checked').value;
          window.electronAPI.setTheme(theme);
          window.electronAPI.setSyncJupyterLabTheme(syncJupyterLabThemeCheckbox.checked);
          const showNewsFeedCheckbox = document.getElementById('checkbox-show-news-feed');
          window.electronAPI.setShowNewsFeed(showNewsFeedCheckbox.checked);
          const frontEndMode = document.querySelector('jp-radio[name="frontend-mode"].checked').value;
          window.electronAPI.setFrontEndMode(frontEndMode);
          window.electronAPI.setCheckForUpdatesAutomatically(autoUpdateCheckCheckbox.checked);
          window.electronAPI.setInstallUpdatesAutomatically(autoInstallCheckbox.checked);

          window.electronAPI.setDefaultWorkingDirectory(workingDirectoryInput.value);

          if (defaultPythonEnvChanged) {
            if (bundledEnvRadio.checked) {
              window.electronAPI.setDefaultPythonPath('');
            } else {
              window.electronAPI.validatePythonPath(pythonPathInput.value).then((valid) => {
                if (valid) {
                  window.electronAPI.setDefaultPythonPath(pythonPathInput.value);
                } else {
                  window.electronAPI.showInvalidPythonPathMessage(pythonPathInput.value);
                }
              });
            }
          }

          window.electronAPI.restartApp();
        }
      </script>
    `;
    this._pageBody = ejs.render(template, {
      theme,
      syncJupyterLabTheme,
      showNewsFeed,
      checkForUpdatesAutomatically,
      installUpdatesAutomaticallyEnabled,
      installUpdatesAutomatically,
      frontEndMode,
      defaultWorkingDirectory,
      defaultPythonPath,
      selectBundledPythonPath,
      bundledEnvExists
    });
  }

  get window(): BrowserWindow {
    return this._window.window;
  }

  load() {
    this._window.loadDialogContent(this._pageBody);
  }

  private _window: ThemedWindow;
  private _pageBody: string;
}

export namespace PreferencesDialog {
  export interface IOptions {
    theme: ThemeType;
    syncJupyterLabTheme: boolean;
    showNewsFeed: boolean;
    frontEndMode: FrontEndMode;
    checkForUpdatesAutomatically: boolean;
    installUpdatesAutomatically: boolean;
    defaultWorkingDirectory: string;
    defaultPythonPath: string;
  }
}