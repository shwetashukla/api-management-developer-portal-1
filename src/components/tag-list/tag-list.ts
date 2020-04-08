import { TagService } from "./../../services/tagService";
import * as ko from "knockout";
import * as Constants from "../../constants";
import template from "./tag-list.html";
import { Component, OnMounted, Event } from "@paperbits/common/ko/decorators";
import { Tag } from "../../models/tag";

@Component({
    selector: "tag-list",
    template: template
})
export class TagList {
    public readonly tags: ko.ObservableArray<Tag>;
    public readonly pattern: ko.Observable<string>;

    constructor(private readonly tagService: TagService) {
        this.tags = ko.observableArray();
        this.pattern = ko.observable();
    }

    @Event()
    public onSelect: (tag: Tag) => void;

    @OnMounted()
    public async initialize(): Promise<void> {
        await this.resetSearch();

        this.pattern
            .extend({ rateLimit: { timeout: Constants.defaultInputDelayMs, method: "notifyWhenChangesStop" } })
            .subscribe(this.resetSearch);
    }

    public async loadPageOfTags(): Promise<void> {
        const pageOfTags = await this.tagService.getTags("apis");
    
        this.tags(pageOfTags.value);
    }

    public async resetSearch(): Promise<void> {
        // this.page(1);
        this.loadPageOfTags();
    }

    public selectTag(tag: Tag): void {
        this.onSelect(tag);
    }
}