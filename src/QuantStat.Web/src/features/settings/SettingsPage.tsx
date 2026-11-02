import {
  Languages,
  Monitor,
  Moon,
  Palette,
  Sun,
  WalletCards,
} from 'lucide-react'

import {
  useAccount,
  useMsal,
} from '@azure/msal-react'

import {
  usePreferences,
} from '../../preferences/PreferencesContext'

import type {
  AppLanguage,
  AppTheme,
  QuoteCurrency,
} from '../../preferences/PreferencesContext'


const themes:
  Array<{
    value: AppTheme
    label:
      | 'dark'
      | 'light'
      | 'system'
    icon:
      typeof Moon
  }> = [
    {
      value: 'dark',
      label: 'dark',
      icon: Moon,
    },
    {
      value: 'light',
      label: 'light',
      icon: Sun,
    },
    {
      value: 'system',
      label: 'system',
      icon: Monitor,
    },
  ]


const currencies:
  QuoteCurrency[] = [
    'USD',
    'EUR',
    'GBP',
    'USDT',
    'USDC',
    'BTC',
    'ETH',
  ]


function SettingsPage() {
  const {
    accounts,
  } =
    useMsal()

  const account =
    useAccount(
      accounts[0] ?? null,
    )

  const {
    preferences,
    setTheme,
    setLanguage,
    setCurrency,
    translate,
  } =
    usePreferences()


  return (
    <>

      <section className="page-heading">

        <div>

          <h1>
            {translate(
              'preferences',
            )}
          </h1>

          <p>
            {translate(
              'preferencesDescription',
            )}
          </p>

        </div>

      </section>


      <section className="settings-grid">

        <article className="settings-card">

          <div className="settings-card-heading">

            <Palette size={20} />

            <div>
              <h2>
                {translate(
                  'appearance',
                )}
              </h2>

              <p>
                {translate(
                  'theme',
                )}
              </p>
            </div>

          </div>


          <div className="theme-choice-grid">

            {themes.map(
              item => {
                const Icon =
                  item.icon

                return (
                  <button
                    key={item.value}
                    type="button"
                    className={
                      preferences.theme ===
                      item.value
                        ? 'preference-choice active'
                        : 'preference-choice'
                    }
                    onClick={() =>
                      setTheme(
                        item.value,
                      )
                    }
                  >
                    <Icon size={20} />

                    <span>
                      {translate(
                        item.label,
                      )}
                    </span>
                  </button>
                )
              },
            )}

          </div>

        </article>


        <article className="settings-card">

          <div className="settings-card-heading">

            <Languages size={20} />

            <div>
              <h2>
                {translate(
                  'language',
                )}
              </h2>

              <p>
                English / Î•Î»Î»Î·Î½Î¹ÎºÎ¬
              </p>
            </div>

          </div>


          <div className="settings-field">

            <label>
              {translate(
                'language',
              )}

              <select
                value={
                  preferences.language
                }
                onChange={event =>
                  setLanguage(
                    event.target.value as AppLanguage
                  )
                }
              >
                <option value="en">
                  {translate(
                    'english',
                  )}
                </option>

                <option value="el">
                  {translate(
                    'greek',
                  )}
                </option>
              </select>
            </label>

          </div>

        </article>


        <article className="settings-card">

          <div className="settings-card-heading">

            <WalletCards size={20} />

            <div>
              <h2>
                {translate(
                  'currency',
                )}
              </h2>

              <p>
                {translate(
                  'currencyHelp',
                )}
              </p>
            </div>

          </div>


          <div className="settings-field">

            <label>
              {translate(
                'currency',
              )}

              <select
                value={
                  preferences.currency
                }
                onChange={event =>
                  setCurrency(
                    event.target.value as QuoteCurrency
                  )
                }
              >
                {currencies.map(
                  currency => (
                    <option
                      key={currency}
                      value={currency}
                    >
                      {currency}
                    </option>
                  ),
                )}
              </select>
            </label>

          </div>

        </article>


        <article className="settings-card account-settings-card">

          <div className="settings-card-heading">

            <div className="account-avatar">
              {(
                account?.name ??
                account?.username ??
                'M'
              )
                .slice(
                  0,
                  1,
                )
                .toUpperCase()}
            </div>

            <div>
              <h2>
                {translate(
                  'account',
                )}
              </h2>

              <p>
                {account?.name ??
                  account?.username ??
                  'Microsoft account'}
              </p>
            </div>

          </div>


          <div className="account-details">

            <span>
              {account?.username}
            </span>

            <small>
              {translate(
                'savedAutomatically',
              )}
            </small>

          </div>

        </article>

      </section>

    </>
  )
}


export default SettingsPage