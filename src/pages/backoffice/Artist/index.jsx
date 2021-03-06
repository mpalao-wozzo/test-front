import React, { useState, useEffect } from 'react';
import { GenericBackoffice, GenericBackofficeElement, GENERIC_TYPES, SureModal } from '@wozzocomp/base-comps';
import {
  createArtist,
  deleteArtist,
  disableArtist,
  enableArtist,
  restoreArtist,
  searchArtistsByFilter,
  updateArtist,
} from '../../../actions/artist';
import { showSuccessToast, showErrorToast } from '../../../utils/toasts';
import { translate } from '../../../utils/translate/translator';
import ActiveInactiveIcon from '../../../components/base/ActiveInactiveIcon';
import forms from '../../../utils/forms';
import Page from '../../../components/base/Page';
import { isFunction } from '../../../utils/functions';

const BackofficeArtistsPage = () => {
  const [ artists, setArtists ] = useState([]);
  const [ loading, setLoading ] = useState(false);
  const [ loadingUpdate, setLoadingUpdate ] = useState(false);
  const [ selectedArtist, setSelectedArtist ] = useState(null);
  const [ showSure, setShowSure ] = useState(false);
  const [ sureMode, setSureMode ] = useState(null);

  const SURE_MODES = {
    DELETE: 'delete',
    DISABLE: 'disable',
    ENABLE: 'enable',
    RESTORE: 'restore',
  };

  const getExtraActions = (artist) => {
    let res = [];
    if (artist && artist._id) {
      res = [
        {
          text: artist.active ? translate('common.disable') : translate('common.enable'),
          icon: artist.active ? 'fas fa-user-times' : 'fas fa-user-check',
          onClick: () => {
            setSelectedArtist(artist);
            setShowSure(true);
            setSureMode(artist.active ? SURE_MODES.DISABLE : SURE_MODES.ENABLE);
          },
        },
      ];
    }

    if (artist.deleted) {
      res.push({
        text: translate('common.restore'),
        icon: 'fas fa-trash-restore-alt',
        onClick: () => {
          setSelectedArtist(artist);
          setShowSure(true);
          setSureMode(SURE_MODES.RESTORE);
        },
      });
    } else {
      res.push({
        text: translate('common.remove'),
        icon: 'fas fa-trash',
        onClick: () => {
          setSelectedArtist(artist);
          setShowSure(true);
          setSureMode(SURE_MODES.DELETE);
        },
      });
    }

    return res;
  };

  const onSearch = (filter) => {
    setLoading(true);
    searchArtistsByFilter(filter)
      .then((newArtists) => {
        setArtists(newArtists);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!showSure) {
      setSelectedArtist(null);
    }
  }, [ showSure ]);

  const onAcceptSure = () => {
    setLoadingUpdate(true);
    let call = null;

    if (SURE_MODES.ENABLE === sureMode) {
      call = enableArtist;
    }
    if (SURE_MODES.DELETE === sureMode) {
      call = deleteArtist;
    }
    if (SURE_MODES.DISABLE === sureMode) {
      call = disableArtist;
    }
    if (SURE_MODES.RESTORE === sureMode) {
      call = restoreArtist;
    }

    if (isFunction(call)) {
      call(selectedArtist._id)
        .then(() => {
          onSearch();
          setShowSure(false);
          showSuccessToast(translate('artist.updateOk'));
          setLoadingUpdate(false);
        })
        .catch(() => {
          showErrorToast(translate('artist.updateKo'));
          setLoadingUpdate(false);
        });
    }
  };

  const validateArtist = ({ name }) => {
    const errs = { hasErrors: false };

    if (!name || 1 > name?.trim().length) {
      errs.hasErrors = true;
      errs.name = true;
    }

    return errs;
  };

  const onSave = (artist, cb) => {
    setLoadingUpdate(true);
    let saveFunction = createArtist;
    let koMessage = 'artist.createKo';
    let okMessage = 'artist.createOk';

    if (artist?._id) {
      saveFunction = updateArtist;
      koMessage = 'artist.updateKo';
      okMessage = 'artist.updateOk';
    }

    saveFunction(artist)
      .then(() => {
        cb();
        onSearch();
        showSuccessToast(translate(okMessage));
        setLoadingUpdate(false);
      })
      .catch(() => {
        showErrorToast(translate(koMessage));
        setLoadingUpdate(false);
      });
  };

  return (
    <Page id="backoffice-artists-page" backoffice title={translate('navbar.artists')}>
      <GenericBackoffice
        {...forms.backoffice.table}
        tableProps={{
          ...forms.backoffice.table.tableProps,
          csvFileName: translate('artist.artists'),
        }}
        translations={{ ...forms.backoffice.table.translations, noItems: translate('artist.noArtistsFound') }}
        customValidator={validateArtist}
        entity={translate('artist.artist')}
        extraActions={getExtraActions}
        loading={loading}
        objects={artists}
        showDelete={false}
        title={translate('artist.artists')}
        onSave={onSave}
        onSearch={onSearch}>
        <GenericBackofficeElement
          field="_id"
          filterField="_id"
          filterType={GENERIC_TYPES.input}
          hideOnModal
          icon="fas fa-fingerprint"
          isKey
          label={translate('common.id')}
        />
        <GenericBackofficeElement
          field="name"
          filterField="name"
          filterType={GENERIC_TYPES.input}
          icon="fas fa-signature"
          label={translate('artist.name')}
          modalType={GENERIC_TYPES.input}
          tableProps={{ sort: true }}
        />
        <GenericBackofficeElement
          field="description"
          hideOnFilter
          icon="fas fa-signature"
          label={translate('artist.description')}
          modalType={GENERIC_TYPES.input}
          tableProps={{ sort: true }}
        />
        <GenericBackofficeElement
          field="active"
          filterField="active"
          filterProps={{ enableHalfChecked: true }}
          filterType={GENERIC_TYPES.checkbox}
          hideOnModal
          icon="fas fa-phone-alt"
          label={translate('artist.active')}
          tableProps={{ formatter: (cell) => <ActiveInactiveIcon active={cell} />, sort: true }}
        />
        <GenericBackofficeElement
          field="deleted"
          filterField="deleted"
          filterProps={{ enableHalfChecked: true }}
          filterType={GENERIC_TYPES.checkbox}
          hideOnModal
          icon="fas fa-phone-alt"
          label={translate('artist.deleted')}
          tableProps={{ formatter: (cell) => <ActiveInactiveIcon active={cell} />, sort: true }}
        />
      </GenericBackoffice>
      {selectedArtist?._id && showSure && (
        <SureModal
          {...forms.modals.sure}
          header={translate(`artist.${sureMode}`)}
          loading={loadingUpdate}
          onAccept={onAcceptSure}
          onHide={() => setShowSure(false)}
          show={showSure}>
          <p>
            {translate(`artist.${sureMode}Sure`)}: <strong>{selectedArtist.name}</strong>
          </p>
        </SureModal>
      )}
    </Page>
  );
};
export default BackofficeArtistsPage;
