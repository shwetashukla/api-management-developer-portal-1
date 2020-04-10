import * as ko from "knockout";
import template from "./tag-input.html";
import { Component, Event, Param, OnMounted } from "@paperbits/common/ko/decorators";
import { Tag } from "../../models/tag";

@Component({
    selector: "tag-input",
    template: template
})
export class TagInput {
    public readonly tags: ko.ObservableArray<Tag>;

    constructor() {
        this.tags = ko.observableArray();
    }

    @Param()
    public scope: string;

    @Event()
    public onChange: (tags: Tag[]) => void;

    public addTag(tag: Tag): void {
        this.tags.push(tag);

        if (this.onChange) {
            this.onChange(this.tags());
        }
    }

    public removeTag(tag: Tag): void {
        this.tags.remove(tag);

        if (this.onChange) {
            this.onChange(this.tags());
        }
    }
}