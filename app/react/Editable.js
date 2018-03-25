import React from "react";
import store from "./store";
import { reaction } from "mobx";
import { observer } from "mobx-react";
import Modal from "./Modal";
import ResourceCreator from "./ResourceCreator";
import { CVsList } from "./List";

@observer class Editable extends React.Component {
    constructor () {
        super();
        this.state = {
            data: ""
        }
    }

    componentWillMount () {
        this.inline = this.inline || this.props.inline;
        // Set up a reaction: When prop.data changes, setLocalData
        // IMPORTANT: Consider when props change but editing mode is on
        reaction(() => this.props.data.get(),
                 data => this.setLocalData(data));
    }

    setLocalData (newData, autoSave) {
        var newState = Object.assign({}, this.state);
        newState.data = newData;
        // If the autoSave flag is set, call save as a callback on setState
        this.setState(newState, autoSave ? this.save : () => {});
    }

    edit () {
        this.setLocalData(this.props.data.get());
        if (this.input) this.input.focus();
        if (this.customEdit) this.customEdit();
        this.props.changeEditing(true);
    }

    save () {
        this.props.onSave(this.state.data);
        if (this.input) this.input.blur();
        if (this.customSave) this.customSave();
        this.props.changeEditing(false);
    }

    cancel () {
        this.setLocalData(this.props.data.get());
        if (this.input) this.input.blur();
        if (this.customCancel) this.customCancel();
        this.props.changeEditing(false);
    }

    enter (e) {
        if (e.keyCode === 13) {
            this.save();
            e.preventDefault();
        }
    }

    escape (e) {
        if (e.keyCode === 27) {
            this.cancel();
            e.preventDefault();
        }
    }

    escapeOrEnter (e) {
        this.enter(e);
        this.escape(e);
    }

    get editText () {
        return this.props.editText || "Edit";
    }

    get title () {
        if (this.props.title == undefined) return null;

        if (this.props.large) {
            var t = <h5 class="m-0 mr-2">{ this.props.title }</h5>
        } else {
            var t = <h6 class="m-0">{ this.props.title }</h6>
        }
        return <div class="title">{ t }</div>
    }

    editButtons () {
        if (this.props.editing) {
            return (
<div class="controls ml-1">
    <div class="btn-group w-100">
        <button class="btn btn-success w-50 btn-sm"
                onClick={ this.save.bind(this) }>
            Save
        </button>
        <button class="btn btn-danger w-50 btn-sm"
                onClick={ this.cancel.bind(this) }>
            Reset
        </button>
    </div>
</div>
            )
        } else {
            return (
<div class="controls ml-1">
    <button class="btn btn-success w-100 btn-sm" 
            onClick={ this.edit.bind(this) }>
        { this.editText }
    </button>
</div>
            )
        }
    }

    render () {
        return (
<div class={ "editableItem " + (this.inline ? "inline" : "") }>
    { this.title }
    { this.editor() }
    { this.editButtons() }
</div>
        );
    }
}

@observer class EditableInput extends Editable {
    inline = true;
    get largeClass () {
        if (!this.props.large) return "";
        return "form-control-lg";
    }

    editor () {
        if (this.props.editing) {
            return (
<input ref={ input => this.input = input } 
       type="text"
       class={ "form-control " + this.largeClass } 
       value={ this.state.data } onBlur={ this.cancel.bind(this) }
       onKeyDown={ this.escapeOrEnter.bind(this) }
       onChange={ e => this.setLocalData(e.target.value) }
       />
            )
        } else {
            return (
<input ref={ input => this.input = input }
       type="text" 
       class={ "form-control form-control-plaintext " + this.largeClass }
       value={ this.props.data }
       onClick={ this.edit.bind(this) }
       onChange={ _ => {} } // onChange needed, readOnly gives default styling
       />
            )
        }
    }
}

@observer class EditableTextarea extends Editable {
    inline = false;
    enter (e) {
        if (e.keyCode === 13 && e.ctrlKey === true) {
            this.save();
            e.preventDefault();
        }
    }

    editor () {
        if (this.props.editing) {
            return (
<textarea ref={ input => this.input = input } 
          type="text" 
          class="form-control editor editing" 
          onBlur={ this.cancel.bind(this) } 
          onKeyDown={ this.escapeOrEnter.bind(this) } 
          onChange={ e => this.setLocalData(e.target.value) } 
          value={ this.state.data }
          ></textarea>
            )
        } else {
            return (
<textarea ref={ input => this.input = input } 
          type="text" 
          class="form-control form-control-plaintext editor" 
          onClick={ this.edit.bind(this) } 
          onChange={ _ => {} } // onChange needed, readOnly gives default styling
          value={ this.props.data.get() }
          ></textarea>
            )
        }
    }
}

@observer class EditableCVPicker extends Editable {
    constructor () {
        super();
        this.state.modalOpen = false;
    }

    setModalOpen (value) {
        var newState = Object.assign({}, this.state);
        newState.modalOpen = value;
        this.setState(newState);
    }

    openModal   () { this.setModalOpen(true); }
    closeModal  () { this.setModalOpen(false); }
    toggleModal () { this.setModalOpen(!this.state.modalOpen); }

    customEdit   () { this.openModal(); }
    customCancel () { this.closeModal(); }
    customSave   () { this.closeModal(); }

    inline = true;

    setNewId (newId) {
        this.setLocalData(newId, true);
    }

    editButtons () {
        return (
<ResourceCreator small="true"
                 subject="CV"
                 onFinishCreate={ this.setNewId.bind(this) }
                 parser={ _ => 93}>
    <input class="form-control" type="text" require="true"
           placeholder="CV Name"/>
    <p class="mt-3 mb-1">Choose CV PDF to upload...</p>
    <input class="w-100 mb-2" type="file" required="true"/>
</ResourceCreator>
        )
    }

    editor () {
        if (this.props.editing) {
            var cv = store.getCVById(this.state.data);
        } else {
            var cv = store.getCVById(this.props.data.get());
        }
        var text = "yes-flex h-100 form-control form-control-plaintext " +
                   (this.props.large ? "form-control-lg" : "");
        return (
<div class="w-100 d-flex align-items-center">
    <div class={ text }>
        { cv !== undefined ? cv.name.get() : "No CV selected" }
    </div>
    <div class="controls ml-1">
        <button class="btn btn-success w-100 btn-sm" 
                onClick={ this.edit.bind(this) }>
            Select Existing CV
        </button>
    </div>
    <Modal name="cv-picker" title="Pick a CV"
           showing={ this.state.modalOpen } 
           onClose={ this.cancel.bind(this) }>
        <CVsList onSelect={ newId => this.setLocalData(newId, true) }/>
    </Modal>
</div>
        )
    }
}
export { EditableInput, EditableTextarea, EditableCVPicker };
